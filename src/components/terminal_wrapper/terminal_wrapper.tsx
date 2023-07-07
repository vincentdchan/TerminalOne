import { createRef, Component } from "react";
import { ITerminalInitOnlyOptions, ITerminalOptions, Terminal } from "xterm.es";
import { WebglAddon } from "xterm-addon-webgl.es";
import { WebLinksAddon } from "xterm-addon-web-links.es";
import { SearchAddon } from "xterm-addon-search.es";
import { FitAddon } from "xterm-addon-fit.es";
import { invoke } from "@tauri-apps/api/tauri";
import { Session } from "@pkg/models/session";
import { AppTheme } from "@pkg/models/app_theme";
import { debounce } from "lodash-es";
import { interval, type Subscription } from "rxjs";
import classNames from "classnames";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import type { AppState } from "@pkg/models/app_state";
import type { TerminalStatistic } from "@pkg/messages";
import HotKeysHandler, { TerminalProxy } from "./hotkeys_handler";
import "./terminal_wrapper.css";
import "xterm.es/css/xterm.css";

export interface TerminalWrapperProps {
  appState: AppState;
  session: Session;
  theme: AppTheme;
  width: number;
  height: number;
  active?: boolean;
}

interface TerminalWrapperState {
  loading: boolean;
}

export class TerminalWrapper
  extends Component<TerminalWrapperProps, TerminalWrapperState>
  implements TerminalProxy
{
  private containerRef = createRef<HTMLDivElement>();
  private terminal?: Terminal;
  private fitAddon?: FitAddon;
  #hotKeysHandler: HotKeysHandler;
  #subscriptions: Subscription[] = [];
  #unlistens: UnlistenFn[] = [];

  constructor(props: TerminalWrapperProps) {
    super(props);

    const { appState } = props;
    const settings = appState.settings$.value!;

    this.#hotKeysHandler = new HotKeysHandler(settings.keys);
  }

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

    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      this.fitAddon?.fit();
    }
  }

  generateTermOptions(): ITerminalOptions & ITerminalInitOnlyOptions {
    const { theme, appState } = this.props;
    const settings = appState.settings$.value!;
    const { terminal: terminalSettings } = settings;
    return {
      fontSize: terminalSettings["font-size"],
      scrollback: terminalSettings.scrollback,
      scrollOnUserInput: true,
      theme: {
        foreground: theme.colors.foreground,
        background: theme.colors.background,
        extendedAnsi: theme.colors.ansi,
      },
    };
  }

  #customKeyEventHandler = (e: KeyboardEvent): boolean => {
    const terminal = this.terminal;
    if (!terminal) {
      return true;
    }

    return this.#hotKeysHandler.handle(e, this);
  };

  async initTerminal() {
    const { session } = this.props;
    const { id } = session;
    await invoke("new_terminal", {
      id,
      path: session.initPath,
    });
    const initOptions = this.generateTermOptions();
    const terminal = new Terminal(initOptions);
    terminal.attachCustomKeyEventHandler(this.#customKeyEventHandler);
    this.terminal = terminal;
    const fitAddon = new FitAddon();
    this.fitAddon = fitAddon;
    terminal.loadAddon(fitAddon);
    const searchAddon = new SearchAddon();
    terminal.loadAddon(searchAddon);
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
      this.sendTerminalData(data);
    });

    terminal.onTitleChange((title) => {
      const session = this.props.session;
      session.setTitle(title);
    });

    terminal.onCurrentDirectoryChange((dir) => {
      const session = this.props.session;
      session.setCwdRaw(dir);
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
        this.sendTerminalData(content);
        this.delayFocus();
      })
    );

    this.#subscriptions.push(
      session.ptyOutput$.subscribe((data: string) => {
        terminal.write(data);
      })
    );

    this.#subscriptions.push(
      session.termFocus$.subscribe(() => this.delayFocus())
    );

    this.#subscriptions.push(
      session.searchNext$.subscribe((content) => {
        searchAddon.findNext(content);
      })
    );

    // When the search box closed, clear the search result
    this.#subscriptions.push(
      session.showSearchBox$.subscribe((value) => {
        if (!value) {
          searchAddon.clearDecorations();
          searchAddon.clearActiveDecoration();
        }
      })
    );

    this.#initMonitor();

    this.delayFocus();
    session.uiReady$.next(true);
  }

  #initMonitor() {
    const event$ = interval(2000);
    const { session } = this.props;
    const s = event$.subscribe(async () => {
      const statistic: TerminalStatistic = await invoke(
        "get_terminal_statistics",
        {
          id: session.id,
        }
      );

      session.pushStatistic(statistic);
    });

    this.#subscriptions.push(s);
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

  async sendTerminalData(data: string) {
    const id = this.props.session.id;
    await invoke("send_terminal_data", {
      id,
      data,
    });
  }

  clearTerminal(): void {
    this.terminal?.clear();
  }

  override componentWillUnmount(): void {
    this.#unlistens.forEach((u) => u());
    this.removeTerminal();
    this.#subscriptions.forEach((s) => s.unsubscribe());
  }

  async removeTerminal() {
    const termId = this.props.session.id;
    await invoke("remove_terminal", { id: termId });
    console.log("terminal removed:", termId);
    this.terminal = undefined;
  }

  #handleFileDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const content = e.dataTransfer?.getData("text/plain");

    if (content && content.startsWith("file://")) {
      const path = content.replace("file://", "");
      this.props.session.shellInput$.next(`"${path}"`);
      // } else if (e.dataTransfer.items) {
      //   // Use DataTransferItemList interface to access the file(s)
      //   [...e.dataTransfer.items].forEach((item, i) => {
      //     // If dropped items aren't files, reject them
      //     if (item.kind === "file") {
      //       const file = item.getAsFile();
      //       console.log(`… file[${i}].name = ${file?.name}`);
      //     }
      //   });
    } else {
      // Use DataTransfer interface to access the file(s)
      [...e.dataTransfer.files].forEach((file, i) => {
        console.log(`… file[${i}].name = ${file.name}`, file);
      });
    }
  };

  #handleDragOver = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  override render() {
    const { width, height } = this.props;
    return (
      <div
        onDrop={this.#handleFileDropEvent}
        onDragOver={this.#handleDragOver}
        className={classNames("t1-term-main-content", {
          unactive: !this.props.active,
        })}
        style={{
          width,
          height,
        }}
        ref={this.containerRef}
      >
      </div>
    );
  }
}
