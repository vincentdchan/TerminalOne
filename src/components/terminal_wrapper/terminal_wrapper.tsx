import { createRef, Component } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Terminal } from "xterm";
import { WebglAddon } from "xterm-addon-webgl";
import { WebLinksAddon } from "xterm-addon-web-links";
import { invoke } from "@tauri-apps/api/tauri";
import { Session } from "@pkg/models/session";
import { runInAction } from "mobx";
import "./terminal_wrapper.scss";
import "xterm/css/xterm.css";

export interface TerminalWrapperProps {
  session: Session;
  active?: boolean;
}

interface TerminalWrapperState {
  loading: boolean;
}

interface PtyResponse {
  id: string;
  data: Uint8Array;
}

export class TerminalWrapper extends Component<
  TerminalWrapperProps,
  TerminalWrapperState
> {
  private containerRef = createRef<HTMLDivElement>();
  private termId: string | undefined;
  private unlistenFn?: UnlistenFn;
  private terminal?: Terminal;

  override componentDidMount(): void {
    this.initTerminal();
  }

  override componentDidUpdate(prevProps: Readonly<TerminalWrapperProps>): void {
    if (!prevProps.active && this.props.active) {
      setTimeout(() => {
        this.terminal?.focus();
      });
    }
  }

  async initTerminal() {
    const id: string = await invoke("new_terminal");
    console.log("new term id:", id);
    this.termId = id;
    const terminal = new Terminal();
    this.terminal = terminal;
    terminal.open(this.containerRef.current!);
    terminal.loadAddon(new WebglAddon());
    terminal.loadAddon(new WebLinksAddon());

    terminal.onData((data) => {
      this.sendTerminalData(id, data);
    });

    terminal.onTitleChange((title) => {
      const session = this.props.session;
      runInAction(() => {
        session.title = title;
      });
    });

    this.unlistenFn = await listen("pty-output", (event) => {
      const resp = event.payload as PtyResponse;
      if (resp.id === id) {
        terminal.write(resp.data);
      }
    });
  }

  async sendTerminalData(id: string, data: string) {
    await invoke("send_terminal_data", {
      id,
      data,
    });
  }

  override componentWillUnmount(): void {
    this.removeTerminal();
    this.unlistenFn?.();
  }

  async removeTerminal() {
    if (!this.termId) {
      return;
    }
    await invoke("remove_terminal", { id: this.termId });
    console.log("terminal removed:", this.termId);
    this.terminal = undefined;
  }

  override render() {
    let cls = "gpterm-instance-container";

    if (!this.props.active) {
      cls += " unactive"
    }

    return (
      <div className={cls}>
        <div ref={this.containerRef} className="gpterm-main"></div>
      </div>
    );
  }
}
