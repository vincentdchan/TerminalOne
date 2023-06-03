import { createRef, Component } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Terminal } from "xterm";
import { WebglAddon } from "xterm-addon-webgl";
import { WebLinksAddon } from "xterm-addon-web-links";
import { FitAddon } from 'xterm-addon-fit';
import { invoke } from "@tauri-apps/api/tauri";
import { Session } from "@pkg/models/session";
import { AppTheme } from "@pkg/models/app_theme";
import { runInAction } from "mobx";
import { debounce } from "lodash-es";
import "./terminal_wrapper.scss";
import "xterm/css/xterm.css";

export interface TerminalWrapperProps {
  session: Session;
  theme: AppTheme,
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
  private fitAddon?: FitAddon;
  private resizeObserver?: ResizeObserver;

  override componentDidMount(): void {
    this.initTerminal();
  }

  override componentDidUpdate(prevProps: Readonly<TerminalWrapperProps>): void {
    if (!prevProps.active && this.props.active) {
      this.terminal?.focus();
      this.fitAddon?.fit();
    }
  }

  async initTerminal() {
    const { theme } = this.props;
    const id: string = await invoke("new_terminal");
    console.log("new term id:", id);
    this.termId = id;
    const terminal = new Terminal({
      theme: {
        foreground: theme.colors.foreground,
        background: theme.colors.background,
        extendedAnsi: theme.colors.ansi,
      }
    });
    this.terminal = terminal;
    const fitAddon = new FitAddon();
    this.fitAddon = fitAddon;
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebglAddon());
    terminal.loadAddon(new WebLinksAddon());
    terminal.open(this.containerRef.current!);
    this.fitAddon.fit();

    terminal.onData((data) => {
      this.sendTerminalData(id, data);
    });

    terminal.onTitleChange((title) => {
      const session = this.props.session;
      runInAction(() => {
        session.title = title;
      });
    });

    terminal.onCurrentDirectoryChange((dir) => {
      console.log("dir changed:", dir);
    });

    terminal.onResize((size) => {
      invoke('resize_pty', {
        id,
        cols: size.cols,
        rows: size.rows,
      })
    });

    this.unlistenFn = await listen("pty-output", (event) => {
      const resp = event.payload as PtyResponse;
      if (resp.id === id) {
        terminal.write(resp.data);
      }
    });

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.props.active) {
        return;
      }
      this.fitSize();
    })
    this.resizeObserver.observe(this.containerRef.current!);

    window.requestAnimationFrame(() => {
      terminal.focus();
    })
  }

  fitSize = debounce(() => {
    this.fitAddon?.fit();
  }, 100);

  async sendTerminalData(id: string, data: string) {
    await invoke("send_terminal_data", {
      id,
      data,
    });
  }

  override componentWillUnmount(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
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
