import React from 'react';
import DrawingCanvas from './components/DrawingCanvas';

function App() {
  console.log("hello")
  return (
    <div>
      <h1 style={{textAlign: "center"}}>AI Drawing Canvas</h1>
      <DrawingCanvas />
    </div>
    
  );
}

export default App;

