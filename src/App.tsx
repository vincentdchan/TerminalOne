import { useState, useRef, useEffect } from "react";
// import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import "./App.css";

function TerminalWrapper() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const terminal = new Terminal();
    terminal.open(containerRef.current!);
    terminal.write("Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ");
    terminal.onData((data) => {
      terminal.write(data);
    });
    return () => terminal.dispose();
  }, [containerRef.current]);

  return <div ref={containerRef} className="gpterm-main"></div>;
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <TerminalWrapper />

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
