import { memo, lazy, Suspense, useCallback, useEffect } from "react";
import { type Session } from "@pkg/models/session";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import Action from "./action";
import classes from "./toolbar.module.css";
import { fromEvent } from "rxjs";
import StatAction from "./stat_action";

export const OUTLINE_DEFAULT_COLOR = "rgb(250, 127, 86)";

const SearchBox = lazy(() => import("@pkg/components/searchbox"));

export interface ToolbarProps {
  session: Session;
}

const Toolbar = memo((props: ToolbarProps) => {
  const { session } = props;
  const actions = useBehaviorSubject(session.actions$);
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
        session.showSearchBox();
      } else if (e.key === "Escape") {
        session.closeSearchBox();
      }
    });

    return () => s.unsubscribe();
  }, []);

  return (
    <div className="t1-terminal-toolbar t1-noselect">
      <div className={classes.actionsContainer}>
        {actions.map((action) => {
          return <Action key={action.extName} payload={action} />;
        })}
        {(statistics.last()?.totalChildrenCount ?? 0) > 0 && (
          <StatAction session={session} />
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
