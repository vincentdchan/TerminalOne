import { memo, lazy, Suspense, useCallback, useEffect } from "react";
import { type Session } from "@pkg/models/session";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import ToolbarButton from "./toolbar_button";
import classes from "./toolbar.module.css";
import { fromEvent } from "rxjs";
import StatToolbarButton from "./stat_toolbar_button";

export const OUTLINE_DEFAULT_COLOR = "rgb(250, 127, 86)";

const SearchBox = lazy(() => import("@pkg/components/searchbox"));

export interface ToolbarProps {
  session: Session;
}

const NUM_1_KEYCODE = 49;
const NUM_9_KEYCODE = 57;

const Toolbar = memo((props: ToolbarProps) => {
  const { session } = props;
  const toolbarButtons = useBehaviorSubject(session.toolbarButtons$);
  const showSearchBox = useBehaviorSubject(session.showSearchBox$);
  const statistics = useBehaviorSubject(session.statistics$);

  const handleSearchBoxClose = useCallback(() => {
    session.closeSearchBox();
  }, [session]);

  useEffect(() => {
    const keydown = fromEvent<KeyboardEvent>(window, "keydown", {
      capture: true,
    });
    const s = keydown.subscribe((e: KeyboardEvent) => {
      if (e.metaKey && e.key === "f") {
        e.preventDefault();
        session.showSearchBox();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        session.closeSearchBox();
        session.resetActiveToolbarButtonIndex();
        return;
      }

      if (
        e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        e.which >= NUM_1_KEYCODE &&
        e.which <= NUM_9_KEYCODE
      ) {
        e.preventDefault();
        e.stopPropagation();
        const index = e.which - NUM_1_KEYCODE;
        session.activeToolbarButtonIndex$.next(index);
      }
    });

    return () => s.unsubscribe();
  }, [toolbarButtons, session]);

  return (
    <div className="t1-terminal-toolbar t1-noselect">
      <div className={classes.actionsContainer}>
        {toolbarButtons.map((action, index) => {
          return (
            <ToolbarButton
              key={action.extName}
              payload={action}
              index={index}
              session={session}
            />
          );
        })}
        {(statistics.last()?.totalChildrenCount ?? 0) > 0 && (
          <StatToolbarButton session={session} />
        )}
      </div>
      <div className={classes.searchBoxContainer}>
        {showSearchBox && (
          <Suspense>
            <SearchBox session={session} onClose={handleSearchBoxClose} />
          </Suspense>
        )}
      </div>
    </div>
  );
});

export default Toolbar;
