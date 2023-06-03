import { createRef, Component } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Terminal } from "xterm";
import { WebglAddon } from 'xterm-addon-webgl';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { invoke } from "@tauri-apps/api/tauri";
import "xterm/css/xterm.css";

interface TerminalWrapperState {
  loading: boolean;
}

interface PtyResponse {
  id: string,
  data: Uint8Array,
}

export class TerminalWrapper extends Component<{}, TerminalWrapperState> {
  private containerRef = createRef<HTMLDivElement>();
  private termId: string | undefined;
  private unlistenFn?: UnlistenFn;

  constructor(props: {}) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  override componentDidMount(): void {
    this.initTerminal();
  }

  async initTerminal() {
    const id: string = await invoke('new_terminal');
    console.log("new term id:", id);
    this.termId = id;
    this.setState({
       loading: false,
    }, () => {
      const terminal = new Terminal();
      terminal.open(this.containerRef.current!);
      terminal.loadAddon(new WebglAddon());
      terminal.loadAddon(new WebLinksAddon());

      terminal.onData((data) => {
        this.sendTerminalData(id, data);
      });

      listen('pty-output', (event) => {
        const resp =event.payload as PtyResponse;
        if (resp.id === id) {
          terminal.write(resp.data);
        }
      }).then((fn) => {
        this.unlistenFn = fn;
      });
    });
  }

  async sendTerminalData(id: string, data: string) {
    await invoke('send_terminal_data', {
      id, data,
    });
  }

  override componentWillUnmount(): void {
    this.removeTerminal();
    this.unlistenFn?.();
  }

  async removeTerminal() {
    if (this.termId) {
      await invoke('remove_terminal', { id: this.termId });
      console.log("terminal removed:", this.termId);
    }
  }

  render() {
    return (
      <div className="gpterm-container">
        <div>{this.state.loading ? "Loading..." : "Loaded"}</div>
        <div ref={this.containerRef} className="gpterm-main"></div>
      </div>
    );
  }
}
