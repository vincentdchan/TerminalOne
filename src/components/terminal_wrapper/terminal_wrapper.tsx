import { createRef, Component } from "react";
import { Terminal } from "xterm.es";
import { WebglAddon } from "xterm-addon-webgl.es";
import { WebLinksAddon } from "xterm-addon-web-links.es";
import { FitAddon } from "xterm-addon-fit.es";
import { invoke } from "@tauri-apps/api/tauri";
import { Session } from "@pkg/models/session";
import { AppTheme } from "@pkg/models/app_theme";
import { debounce } from "lodash-es";
import { type Subscription } from "rxjs";
import classNames from "classnames";
import classes from "./terminal_wrapper.module.css";
import Toolbar from "./toolbar";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import type { AppState } from "@pkg/models/app_state";
import "xterm.es/css/xterm.css";

export interface TerminalWrapperProps {
  appState: AppState;
  session: Session;
  theme: AppTheme;
  active?: boolean;
}

interface TerminalWrapperState {
  loading: boolean;
}

const FILE_PREFIX = "file://";

export class TerminalWrapper extends Component<
  TerminalWrapperProps,
  TerminalWrapperState
> {
  private containerRef = createRef<HTMLDivElement>();
  private terminal?: Terminal;
  private fitAddon?: FitAddon;
  private resizeObserver?: ResizeObserver;
  #subscriptions: Subscription[] = [];
  #unlistens: UnlistenFn[] = [];

  override componentDidMount(): void {
    listen("tauri://move", () => {
      if (this.props.active) {
        this.delayFocus();
      }
    }).then((unlisten) => {
      this.#unlistens.push(unlisten);
    });
    const s = this.props.appState.modalClosed$.subscribe(() =>
      this.delayFocus()
    );
    this.#subscriptions.push(s);
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
      },
    });
    this.terminal = terminal;
    const fitAddon = new FitAddon();
    this.fitAddon = fitAddon;
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebglAddon());
    terminal.loadAddon(
      new WebLinksAddon(async (_event, link) => {
        await invoke("launch_url", {
          url: link,
        });
      })
    );
    terminal.open(this.containerRef.current!);

    window.requestAnimationFrame(() => {
      this.fitAddon?.fit();
    });

    terminal.onData((data) => {
      this.sendTerminalData(id, data);
    });

    terminal.onTitleChange((title) => {
      const session = this.props.session;
      session.setTitle(title);
    });

    terminal.onCurrentDirectoryChange((dir) => {
      const session = this.props.session;
      if (dir.startsWith(FILE_PREFIX)) {
        dir = dir.substring(FILE_PREFIX.length);
      }
      session.setCwd(dir);
    });

    terminal.onResize((size) => {
      console.log("terminal resize:", size);
      invoke("resize_pty", {
        id,
        cols: size.cols,
        rows: size.rows,
      });
    });

    this.#subscriptions.push(
      session.shellInput$.subscribe((content: string) => {
        this.sendTerminalData(id, content);
        this.delayFocus();
      })
    );

    this.#subscriptions.push(
      session.ptyOutput$.subscribe((data: Uint8Array) => {
        terminal.write(data);
      })
    );

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.props.active) {
        return;
      }
      this.fitSize();
    });
    this.resizeObserver.observe(this.containerRef.current!);
    this.delayFocus();
  }

  delayFocus() {
    const terminal = this.terminal;
    if (!terminal) {
      return;
    }
    window.requestAnimationFrame(() => {
      terminal.focus();
    });
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
    this.#unlistens.forEach((u) => u());
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.removeTerminal();
    this.#subscriptions.forEach((s) => s.unsubscribe());
  }

  async removeTerminal() {
    const termId = this.props.session.id;
    await invoke("remove_terminal", { id: termId });
    console.log("terminal removed:", termId);
    this.terminal = undefined;
  }

  override render() {
    return (
      <div
        className={classNames(classes.instanceContainer, {
          unactive: !this.props.active,
        })}
      >
        <Toolbar session={this.props.session} />
        <div ref={this.containerRef} className={classes.mainContent}></div>
      </div>
    );
  }
}
