import { createRef, Component } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Terminal } from "xterm.es";
import { WebglAddon } from "xterm-addon-webgl.es";
import { WebLinksAddon } from "xterm-addon-web-links.es";
import { FitAddon } from 'xterm-addon-fit.es';
import { invoke } from "@tauri-apps/api/tauri";
import { Session } from "@pkg/models/session";
import { AppTheme } from "@pkg/models/app_theme";
import { debounce } from "lodash-es";
import { PushMessages } from "@pkg/constants";
import { type Subscription } from "rxjs";
import "./terminal_wrapper.scss";
import "xterm.es/css/xterm.css";

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
  private unlistenFn?: UnlistenFn;
  private terminal?: Terminal;
  private fitAddon?: FitAddon;
  private resizeObserver?: ResizeObserver;
  #subscriptions: Subscription[] = [];

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
    const { session, theme } = this.props;
    const { id } = session;
    await invoke("new_terminal", {
      id,
    });
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
    terminal.loadAddon(new WebLinksAddon(async (_event, link) => {
      await invoke('launch_url', {
        url: link
      });
    }));
    terminal.open(this.containerRef.current!);

    window.requestAnimationFrame(() => {
      this.fitAddon?.fit();
    });

    terminal.onData((data) => {
      this.sendTerminalData(id, data);
    });

    terminal.onTitleChange((title) => {
      const session = this.props.session;
      session.title$.next(title);
    });

    terminal.onCurrentDirectoryChange((dir) => {
      const session = this.props.session;
      session.cwd$.next(dir);
    });

    terminal.onResize((size) => {
      console.log("terminal resize:", size);
      invoke('resize_pty', {
        id,
        cols: size.cols,
        rows: size.rows,
      })
    });

    this.#subscriptions.push(session.shellInput$.subscribe((content: string) => {
      this.sendTerminalData(id, content);
    }));

    this.unlistenFn = await listen(PushMessages.PTY_OUTPUT, (event) => {
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
    this.#subscriptions.forEach(s => s.unsubscribe());
  }

  async removeTerminal() {
    const termId = this.props.session.id;
    await invoke("remove_terminal", { id: termId });
    console.log("terminal removed:", termId);
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
