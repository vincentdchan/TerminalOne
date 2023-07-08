import ReactDOM from "react-dom/client";
import App from "./App";
import { invoke } from "@tauri-apps/api";
import "./styles.css";

const originalError = console.error.bind(console);
console.error = (...args: any[]) => {
  originalError(...args);
  invoke("console_log", {
    level: "error",
    data: args,
  });
};

window.onerror = function (error, url, line) {
  console.error({
    acc: "error",
    data: "ERR:" + error + " URL:" + url + " L:" + line,
  });
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
