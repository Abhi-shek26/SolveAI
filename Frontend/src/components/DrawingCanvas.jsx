import React, { useEffect, useRef, useState } from 'react';

const palette = [
  '#4ff1c8',
  '#f472b6',
  '#93c5fd',
  '#c4b5fd',
  '#facc15',
  '#fb7185',
  '#22d3ee',
];

const backgrounds = [
  '#0f172a',
  
  '#1a1f35',
  '#000000',
  '#ffffff',
  '#fef3c7',
  '#e0e7ff',
];

const defaultSize = {
  width: 720,
  height: 480,
};

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(palette[0]);
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [background, setBackground] = useState(backgrounds[0]);
  const [canvasSize, setCanvasSize] = useState(defaultSize);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const resize = () => {
      const maxWidth = Math.min(760, node.clientWidth - 12);
      const width = Math.max(320, maxWidth);
      const height = Math.round(width * 0.66);
      setCanvasSize({ width, height });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    paintBackground(context, background, canvasSize);
  }, [background, canvasSize]);

  useEffect(() => {
    setCopied(false);
  }, [analysis]);

  const paintBackground = (context, fill, size) => {
    context.save();
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = fill;
    context.fillRect(0, 0, size.width, size.height);
    context.restore();
  };

  const getContext = () => canvasRef.current?.getContext('2d');

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const context = getContext();
    if (!context) return;

    const { x, y } = getPoint(event);
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = isEraser ? background : color;
    context.lineWidth = isEraser ? brushSize * 2.2 : brushSize;
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const context = getContext();
    if (!context) return;
    const { x, y } = getPoint(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleReset = () => {
    const context = getContext();
    if (!context) return;
    paintBackground(context, background, canvasSize);
    setStatus('Canvas cleared');
  };

  const handleRun = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = canvas.toDataURL('image/png');
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');

    setLoading(true);
    setAnalysis('');
    setStatus('Uploading sketch...');

    try {
      const response = await fetch(`${backendUrl}/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      setStatus('Waiting for analysis...');
      const data = await response.json();
      setAnalysis(data.analysis || 'No response from AI.');
      setStatus('Analysis complete');
    } catch (error) {
      console.error('Error:', error);
      setAnalysis('Error analyzing the image. Check the backend URL.');
      setStatus('Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'solveai-sketch.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  };

  return (
    <div className="canvas-shell" ref={containerRef}>
      <div className="toolbar">
        <div className="toolbar__group">
          <p className="label">Palette</p>
          <div className="swatches">
            {palette.map((swatch) => (
              <button
                key={swatch}
                className={`swatch ${color === swatch && !isEraser ? 'swatch--active' : ''}`}
                style={{ background: swatch }}
                onClick={() => {
                  setColor(swatch);
                  setIsEraser(false);
                }}
                aria-label={`Select color ${swatch}`}
              />
            ))}
            <label className="swatch custom">
              <input
                type="color"
                value={color}
                onChange={(event) => {
                  setColor(event.target.value);
                  setIsEraser(false);
                }}
                aria-label="Custom color"
              />
              <span>🔎</span>
            </label>
          </div>
        </div>

        <div className="toolbar__group">
          <p className="label">Brush size</p>
          <div className="slider-row">
            <input
              type="range"
              min="2"
              max="32"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
            />
            <span className="slider-value">{brushSize}px</span>
          </div>
        </div>

        <div className="toolbar__group">
          <p className="label">Background</p>
          <div className="swatches">
            {backgrounds.map((bg) => (
              <button
                key={bg}
                className={`swatch ${background === bg ? 'swatch--active' : ''}`}
                style={{ background: bg }}
                onClick={() => setBackground(bg)}
                aria-label={`Set background ${bg}`}
              />
            ))}
          </div>
        </div>

        <div className="toolbar__actions">
          <button className="btn" onClick={() => setIsEraser(false)} disabled={loading}>
            Draw
          </button>
          <button className={`btn ${isEraser ? 'btn--ghost-active' : 'btn--ghost'}`} onClick={() => setIsEraser(true)} disabled={loading}>
            Eraser
          </button>
          <button className="btn btn--ghost" onClick={handleReset} disabled={loading}>
            Reset
          </button>
          <button className="btn btn--ghost" onClick={handleDownload} disabled={loading}>
            Download
          </button>
          <button className="btn btn--accent" onClick={handleRun} disabled={loading}>
            {loading ? 'Analyzing…' : 'Run AI analysis'}
          </button>
        </div>
      </div>

      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
        <div className="canvas-meta">
          <span className="badge badge--ghost">{canvasSize.width} x {canvasSize.height}px</span>
          <span className="status">{status}</span>
        </div>
      </div>

      <div className="analysis">
        <div className="analysis__header">
          <div>
            <p className="panel__eyebrow">AI response</p>
            <h3 className="panel__title">Analysis Result</h3>
          </div>
          <div className="analysis__actions">
            <button className="btn btn--ghost" onClick={handleCopy} disabled={!analysis}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="analysis__body">
          {analysis ? (
            <div className="response-container">
              <pre className="response-text">{analysis}</pre>
              {analysis.includes('{') && (
                <p className="response-hint">✓ Formatted JSON response</p>
              )}
            </div>
          ) : (
            <p className="muted">📝 Draw something and click "Run AI analysis" to see results here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;


