import { useRef, useState } from "react";

export function App() {
  const [input, setInput] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="app">
      <h1>ドネ返ビュワー</h1>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="ドネ返テキストをペーストしてください"
        rows={10}
      />
      <canvas ref={canvasRef} width={800} height={600} />
    </div>
  );
}
