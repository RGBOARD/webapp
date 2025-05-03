// src/components/CanvasImage.jsx
import React, { useRef, useEffect } from 'react';

/**
 * Draws your pixel_data (JSON of {"x,y":"#rrggbb",…}) into a minimal
 * canvas where each unique x/y position becomes one “cell” pixel,
 * then lets CSS scale it up to `maxSize` with pixelated rendering.
 */
export default function CanvasImage({ pixelData, maxSize = 100 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pixelData) return;
    let data;
    try {
      data = JSON.parse(pixelData);
    } catch {
      console.error('Invalid pixelData JSON');
      return;
    }

    // 1) Turn {"x,y":color} into [{x,y,color},...]
    const points = Object.entries(data).map(([coord, color]) => {
      const [x, y] = coord.split(',').map(Number);
      return { x, y, color };
    });

    // 2) Extract unique sorted Xs and Ys
    const xs = Array.from(new Set(points.map(p => p.x))).sort((a, b) => a - b);
    const ys = Array.from(new Set(points.map(p => p.y))).sort((a, b) => a - b);

    // 3) Build quick lookup for indices
    const xIndex = Object.fromEntries(xs.map((x, i) => [x, i]));
    const yIndex = Object.fromEntries(ys.map((y, i) => [y, i]));

    // 4) Resize canvas to the tiny grid
    const w = xs.length;
    const h = ys.length;
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;

    // 5) Paint each cell (1×1)
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    points.forEach(({ x, y, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(xIndex[x], yIndex[y], 1, 1);
    });
  }, [pixelData]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: `${maxSize}px`,
        height: 'auto',
        imageRendering: 'pixelated',
        border: '1px solid #ddd',
      }}
    />
  );
}
