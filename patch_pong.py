import re

with open('script.js', 'r') as f:
    content = f.read()

# Change const ARENA_W = 60 to let ARENA_W = 60
content = content.replace("const ARENA_W = 60, ARENA_H = 40, PADDLE_H = 12;", "let ARENA_W = 60;\n    const MAX_ARENA_W = 60, ARENA_H = 40, PADDLE_H = 12;")

# Find the start of the step function and add the scaling logic
step_start = """    const step = () => {
      if (!this._pongActive) return;
      pongRAF = requestAnimationFrame(step);"""

step_replacement = """    const step = () => {
      if (!this._pongActive) return;
      pongRAF = requestAnimationFrame(step);

      /* Responsive arena scaling */
      const aspect = window.innerWidth / window.innerHeight;
      ARENA_W = Math.min(MAX_ARENA_W, aspect * 55);
      const scaleX = ARENA_W / MAX_ARENA_W;"""

content = content.replace(step_start, step_replacement)

# Now, we need to replace the particle update loop.
old_update_loop = """      /* Update visual particle positions */
      if (!this._pongBase) {
        this._pongBase = Float32Array.from(this.threeCtx.mainParticles.geometry.attributes.aTarget7.array);
      }
      const attr = this.threeCtx.mainParticles.geometry.attributes.aTarget7;
      const arr = attr.array;
      const base = this._pongBase;
      const count = attr.count;

      /* 0.40 - 0.60: Left Paddle */
      const idxLPStart = Math.floor(0.40 * count);
      const idxLPEnd   = Math.floor(0.60 * count);
      for (let i = idxLPStart; i < idxLPEnd; i++) {
        arr[i*3 + 1] = base[i*3 + 1] + paddleLY;
      }
      
      /* 0.60 - 0.80: Right Paddle */
      const idxRPStart = Math.floor(0.60 * count);
      const idxRPEnd   = Math.floor(0.80 * count);
      for (let i = idxRPStart; i < idxRPEnd; i++) {
        arr[i*3 + 1] = base[i*3 + 1] + paddleRY;
      }

      /* 0.80 - 0.95: Ball */
      const idxBallStart = Math.floor(0.80 * count);
      const idxBallEnd   = Math.floor(0.95 * count);
      for (let i = idxBallStart; i < idxBallEnd; i++) {
        arr[i*3]     = base[i*3]     + ballX;
        arr[i*3 + 1] = base[i*3 + 1] + ballY;
      }
      
      attr.needsUpdate = true;"""

new_update_loop = """      /* Update visual particle positions */
      if (!this._pongBase) {
        this._pongBase = Float32Array.from(this.threeCtx.mainParticles.geometry.attributes.aTarget7.array);
      }
      const attr = this.threeCtx.mainParticles.geometry.attributes.aTarget7;
      const arr = attr.array;
      const base = this._pongBase;
      const count = attr.count;

      const idxLPStart = Math.floor(0.40 * count);
      const idxLPEnd   = Math.floor(0.60 * count);
      const idxRPStart = Math.floor(0.60 * count);
      const idxRPEnd   = Math.floor(0.80 * count);
      const idxBallStart = Math.floor(0.80 * count);
      const idxBallEnd   = Math.floor(0.95 * count);

      for (let i = 0; i < count; i++) {
        if (i >= idxBallStart && i < idxBallEnd) {
          /* Ball */
          arr[i*3]     = base[i*3] + ballX;
          arr[i*3 + 1] = base[i*3 + 1] + ballY;
        } else {
          /* Walls, paddles, and dust scaled proportionally */
          arr[i*3] = base[i*3] * scaleX;
          
          /* Paddle Y updates */
          if (i >= idxLPStart && i < idxLPEnd) {
            arr[i*3 + 1] = base[i*3 + 1] + paddleLY;
          } else if (i >= idxRPStart && i < idxRPEnd) {
            arr[i*3 + 1] = base[i*3 + 1] + paddleRY;
          }
        }
      }
      
      attr.needsUpdate = true;"""

content = content.replace(old_update_loop, new_update_loop)

with open('script.js', 'w') as f:
    f.write(content)
