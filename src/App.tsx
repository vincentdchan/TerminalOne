// import reactLogo from "./assets/react.svg";
import { TerminalWrapper } from "@pkg/components/terminal_wrapper";
import { Tabs } from "@pkg/components/tabs";
import "./App.scss";

function App() {

  return (
    <div className="gpterm-app-container">
      <Tabs></Tabs>
      <TerminalWrapper />
    </div>
  );
}

export default App;
