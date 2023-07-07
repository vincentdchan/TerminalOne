import { useContext, memo, useRef, useEffect, useState } from "react";
import { TerminalWrapper } from "@pkg/components/terminal_wrapper";
import { useBehaviorSubject, useObservable } from "@pkg/hooks/observable";
import { AppContext } from "@pkg/contexts/app_context";
import Toolbar from "@pkg/components/toolbar";
import classes from "./terminal_container.module.css";

interface Size {
  width: number;
  height: number;
}

const zeroSize = { width: 0, height: 0 };

export const TerminalsContainer = memo(() => {
  const appState = useContext(AppContext)!;
  const theme = useBehaviorSubject(appState.theme$)!;

  const { sessionManager } = appState;
  const sessions = useBehaviorSubject(sessionManager.sessions$);
  const activeSession = useObservable(sessionManager.activeSession$, undefined);
  const activeSessionIndex = useBehaviorSubject(
    sessionManager.activeSessionIndex$
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [termSize, setTermSize] = useState<Size>(zeroSize);
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      if (entries.length === 0) {
        return;
      }
      const first = entries[0];
      const domRect = first.contentRect;
      setTermSize({ width: domRect.width, height: domRect.height });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [containerRef.current]);

  return (
    <div className={classes.termsContainer}>
      <div className={classes.toolbarContainer}>
        {!! activeSession && <Toolbar key={activeSession.id} session={activeSession} />}
      </div>
      <div ref={containerRef} className={classes.termsInnerContainer}>
        {sessions.map((session, index) => {
          const active = activeSessionIndex === index;
          return (
            <TerminalWrapper
              key={session.id}
              appState={appState}
              active={active}
              session={session}
              theme={theme}
              width={termSize.width}
              height={termSize.height}
            />
          );
        })}
      </div>
    </div>
  );
});
