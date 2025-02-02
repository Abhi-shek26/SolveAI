import React, { useRef, useState, useEffect } from "react";

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [isEraser, setIsEraser] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const context = canvasRef.current.getContext("2d");

    if (isEraser) {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = 15;
    } else {
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = color;
      context.lineWidth = 5;
    }

    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const context = canvasRef.current.getContext("2d");
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleColorChange = (newColor) => {
    setColor(newColor);
    setIsEraser(false);
  };

  const handleEraserClick = () => {
    setIsEraser(true);
  };

  const handleResetClick = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

  
    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleRunClick = async () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL("image/png"); 

    setLoading(true);
    setAnalysis("");

    try {
      const response = await fetch("http://localhost:5000/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();
      setAnalysis(data.analysis || "No response from AI.");
    } catch (error) {
      console.error("Error:", error);
      setAnalysis("Error analyzing the image.");
    } finally {
      setLoading(false);
    }
  };
  console.log("DrawingCanvas component loaded!");

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Draw Something & Analyze with AI</h2>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{
          border: "2px solid black",
          background: "white",
          cursor: isEraser ? "black" : "default",
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      {/* Controls */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={() => handleColorChange("black")}>Black</button>
        <button onClick={() => handleColorChange("red")}>Red</button>
        <button onClick={() => handleColorChange("blue")}>Blue</button>
        <button onClick={handleEraserClick}>Eraser</button>
        <button onClick={handleResetClick}>Reset</button>
        <button onClick={handleRunClick} disabled={loading}>
          {loading ? "Processing..." : "Run AI Analysis"}
        </button>
      </div>

      {/* Display AI Response */}
      {analysis && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid black" }}>
          <h3>AI Response:</h3>
          <p>{analysis}</p>
        </div>
      )}
    </div>
     
    );
};

export default DrawingCanvas;


