const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

const loaderLogic = `      let phase2T1, phase2T2, phase2T3, phase2T4;
      let hasResolved = false;

      const finishLoader = () => {
        if (hasResolved) return;
        hasResolved = true;
        
        clearInterval(timer);
        clearTimeout(phase2T1);
        clearTimeout(phase2T2);
        clearTimeout(phase2T3);
        clearTimeout(phase2T4);

        const skipBtn = document.getElementById('loader-skip');
        if (skipBtn) skipBtn.remove();
        
        resolve();
      };

      const skipIntro = async () => {
        if (hasResolved) return;

        // 1. Instant UI Feedback
        const skipBtn = document.getElementById('loader-skip');
        if (skipBtn) {
          skipBtn.textContent = '[ SKIPPING... ]';
          skipBtn.style.pointerEvents = 'none';
        }

        clearInterval(timer);
        clearTimeout(phase2T1);
        clearTimeout(phase2T2);
        clearTimeout(phase2T3);
        clearTimeout(phase2T4);

        // Yield to the browser to paint the button text change before we block the main thread.
        // We don't start the GSAP slide-up here because it would stutter and hang 
        // midway through the animation due to the WebGL synchronous compilation freeze.
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 10)));

        // 2. Heavy Synchronous Work (WebGL Compilation)
        if (!particlesInitDone) {
          particlesInitDone = true;
          await this.initParticles();
          this.particlesReady = true;
        }

        // Snap particles
        if (this.threeCtx && !this.threeCtx.is2D) {
          const mats = this.threeCtx.mainMat.uniforms;
          mats.uAlpha.value = 1;
          this.threeCtx.ambMat.uniforms.uAlpha.value = 1;
          mats.uProgress1.value = 1;
          mats.uProgress2.value = 1;
          
          if (window.gsap && this.threeCtx.mainParticles) {
            gsap.killTweensOf(this.threeCtx.mainParticles.scale);
            gsap.killTweensOf(this.threeCtx.mainParticles.rotation);
            gsap.killTweensOf(mats.uSize);
            this.threeCtx.mainParticles.scale.set(1.05, 1.05, 1.05);
            this.threeCtx.mainParticles.rotation.y = 0.08;
            mats.uSize.value = window.innerWidth < 768 ? 2.5 : 3.5;
          }
        }

        // 3. Slide Out Loader
        const loader = this.loader;
        if (loader && window.gsap) {
          gsap.killTweensOf(loader);
          gsap.to(loader, {
            yPercent: -100,
            duration: 0.8,
            ease: 'expo.inOut',
            onComplete: () => { loader.style.display = 'none'; }
          });
        } else if (loader) {
          loader.style.display = 'none';
        }
        
        finishLoader();
      };

      if (document.getElementById('loader-skip')) {
        document.getElementById('loader-skip').addEventListener('click', skipIntro);
      }
`;

code = code.replace(/let particlesInitDone = false;\n\s+this\.particlesReady = false;/, `let particlesInitDone = false;\n      this.particlesReady = false;\n\n${loaderLogic}`);

code = code.replace(/setTimeout\(async \(\) => {\n\s+await this\.initParticles\(\); \/\* WebGL or Canvas2D deferred init \*\/\n\s+this\.particlesReady = true;\n\s+}, 0\);/g, 
`setTimeout(async () => {
              await this.initParticles(); /* WebGL or Canvas2D deferred init */
              this.particlesReady = true;
              
              if (hasResolved && this.threeCtx && !this.threeCtx.is2D) {
                 const mats = this.threeCtx.mainMat.uniforms;
                 mats.uAlpha.value = 1;
                 this.threeCtx.ambMat.uniforms.uAlpha.value = 1;
                 mats.uProgress1.value = 1;
                 mats.uProgress2.value = 1;
              }
            }, 0);`);

code = code.replace(/setTimeout\(\(\) => {\n\s+this\.tweenUniform\(mats\.uProgress1, 0, 1, 2500\); \/\/ 2\.5s duration\n\s+}, 200\);/g, `phase2T1 = setTimeout(() => {\n              this.tweenUniform(mats.uProgress1, 0, 1, 2500); // 2.5s duration\n            }, 200);`);

code = code.replace(/setTimeout\(\(\) => {\n\s+this\.tweenUniform\(mats\.uProgress2, 0, 1, 2500\); \/\/ 2\.5s duration\n\s+}, 3000\);/g, `phase2T2 = setTimeout(() => {\n              this.tweenUniform(mats.uProgress2, 0, 1, 2500); // 2.5s duration\n            }, 3000);`);

code = code.replace(/setTimeout\(resolve, 6000\);/g, `phase2T3 = setTimeout(finishLoader, 6000);`);
code = code.replace(/setTimeout\(resolve, 1500\);/g, `phase2T4 = setTimeout(finishLoader, 1500);`);

fs.writeFileSync('script.js', code);
