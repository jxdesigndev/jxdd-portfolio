self.onmessage = function (e) {
  try {
    const {
      id,
      imgDataBuffer,
      sampleW,
      sampleH,
      useColor = false,
      offsetX = 0,
      offsetY = 0,
      offsetZ = 0,
      scale = 0.6
    } = e.data;

    const imgData = new Uint8ClampedArray(imgDataBuffer);
    
    let rawPixels = [];
    let minX = sampleW, maxX = 0, minY = sampleH, maxY = 0;

    for (let y = 0; y < sampleH; y+=1) {
      for (let x = 0; x < sampleW; x+=1) {
        const idx = (y * sampleW + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx+1];
        const b = imgData[idx+2];
        const a = imgData[idx+3];
        
        const brightness = (r + g + b) / 3;
        
        if (a > 15 && brightness > 8) {
          rawPixels.push({ x, y, r, g, b, brightness });
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (rawPixels.length === 0) {
      self.postMessage({ id, posBuffer: null, colorBuffer: null });
      return;
    }

    const subW = Math.max(1, maxX - minX);
    const subH = Math.max(1, maxY - minY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const maxDim = Math.max(subW, subH);
    const normScale = (65.0 / maxDim) * (scale / 0.6);

    const posArray = new Float32Array(rawPixels.length * 3);
    const colorArray = useColor ? new Float32Array(rawPixels.length * 3) : null;

    for (let i = 0; i < rawPixels.length; i++) {
      const p = rawPixels[i];
      let px = (p.x - centerX) * normScale + offsetX;
      let py = -(p.y - centerY) * normScale + offsetY;
      let pz = (p.brightness / 255) * 5.0 + offsetZ;
      
      posArray[i * 3 + 0] = px;
      posArray[i * 3 + 1] = py;
      posArray[i * 3 + 2] = pz;

      if (useColor) {
        colorArray[i * 3 + 0] = p.r / 255;
        colorArray[i * 3 + 1] = p.g / 255;
        colorArray[i * 3 + 2] = p.b / 255;
      }
    }

    const transferables = [posArray.buffer];
    if (useColor) {
      transferables.push(colorArray.buffer);
    }

    self.postMessage({
      id,
      posBuffer: posArray.buffer,
      colorBuffer: useColor ? colorArray.buffer : null
    }, transferables);

  } catch (err) {
    self.postMessage({
      id: e.data ? e.data.id : null,
      error: err.message,
      posBuffer: null,
      colorBuffer: null
    });
  }
};
