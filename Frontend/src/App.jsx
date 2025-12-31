import React, { useState, useEffect } from 'react';
import DrawingCanvas from './components/DrawingCanvas';

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="page">
      <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
        {isDark ? '☀️' : '🌙'}
      </button>

      <header className="hero">
        <div className="hero__eyebrow">SolveAI Studio</div>
        <h1>Sketch math. Get instant reasoning.</h1>
        <p className="hero__lede">
          Draw equations, diagrams, or geometry problems, then let the model unpack the logic.
          The canvas stays crisp, the output stays structured.
        </p>
        <div className="hero__meta">
          <span className="pill pill--accent">Realtime canvas</span>
        </div>
      </header>

      <main className="layout">
        <section className="panel panel--primary">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Drawing canvas</h2>
            </div>
          </div>
          <DrawingCanvas />
        </section>
      </main>
    </div>
  );
}

export default App;

