import { Suspense, lazy, useState, useCallback } from "react";
import { TerminalsContainer } from "./terminal_container";
import { AppState } from "@pkg/models/app_state";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import { VerticalSplit } from "@pkg/components/vertical_split";
import { fromEvent } from "rxjs";
import { takeUntil } from "rxjs/operators";
import className from "classnames";
import classes from "./main_content_layout.module.css";

export interface MainContentLayoutProps {
  appState: AppState;
}

const FileExplorer = lazy(() => import("@pkg/components/file_explorer"));
const GiftBox = lazy(() => import("@pkg/components/gift_box"));

const MIN_WIDTH = 80;
const DEFAULT_WIDTH = 190;
const RIGHT_DEFAULT_WIDTH = 248;

export function MainContentLayout(props: MainContentLayoutProps) {
  const { appState } = props;
  const showFileExplorer = useBehaviorSubject(appState.showFileExplorer$);
  const showGiftBox = useBehaviorSubject(appState.showGiftBox$);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(DEFAULT_WIDTH);
  const [rightSidebarWidth, setRightSidebarWidth] =
    useState(RIGHT_DEFAULT_WIDTH);

  const handleVerticalSplitMouseDown = useCallback(() => {
    const mouseMove$ = fromEvent<MouseEvent>(window, "mousemove");
    const mouseUp$ = fromEvent<MouseEvent>(window, "mouseup");
    mouseMove$.pipe(takeUntil(mouseUp$)).subscribe((e: MouseEvent) => {
      e.preventDefault();
      const newWidth = e.clientX;

      if (newWidth < MIN_WIDTH) {
        appState.showFileExplorer$.next(false);
        setLeftSidebarWidth(DEFAULT_WIDTH);
        return;
      }

      setLeftSidebarWidth(newWidth);
    });
  }, [setLeftSidebarWidth]);

  const handleRightVerticalSplitMouseDown = useCallback(() => {
    const mouseMove$ = fromEvent<MouseEvent>(window, "mousemove");
    const mouseUp$ = fromEvent<MouseEvent>(window, "mouseup");
    mouseMove$.pipe(takeUntil(mouseUp$)).subscribe((e: MouseEvent) => {
      e.preventDefault();
      const newWidth = window.innerWidth - e.clientX;

      if (newWidth < MIN_WIDTH) {
        appState.showGiftBox$.next(false);
        setRightSidebarWidth(RIGHT_DEFAULT_WIDTH);
        return;
      }

      setRightSidebarWidth(newWidth);
    });
  }, [setRightSidebarWidth]);

  return (
    <div className={classes.mainLayout}>
      <div
        className={classes.layoutLeft}
        style={
          showFileExplorer
            ? {
                width: leftSidebarWidth,
                minWidth: leftSidebarWidth,
              }
            : undefined
        }
      >
        {showFileExplorer && (
          <Suspense>
            <FileExplorer />
          </Suspense>
        )}
      </div>
      <TerminalsContainer />
      <div
        className={className(classes.layoutRight, {
          expanded: showGiftBox,
        })}
        style={
          showGiftBox
            ? {
                width: rightSidebarWidth,
                minWidth: rightSidebarWidth,
              }
            : undefined
        }
      >
        {showGiftBox && (
          <Suspense>
            <GiftBox />
          </Suspense>
        )}
      </div>
      <VerticalSplit
        show={showFileExplorer}
        left={leftSidebarWidth}
        onMouseDown={handleVerticalSplitMouseDown}
      />
      <VerticalSplit
        show={showGiftBox}
        right={rightSidebarWidth}
        onMouseDown={handleRightVerticalSplitMouseDown}
      />
    </div>
  );
}
