import { useCallback } from "react";
import { Tab } from "./tab";
import { SessionManager } from "@pkg/models/session_manager";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import "./tabs.scss";

export interface TabsProps {
  sessionManager: SessionManager;
}

export const Tabs = observer((props: TabsProps) => {
  const { sessionManager } = props;
  const handleAddSession = useCallback(() => {
    sessionManager.newTab();
  }, [sessionManager]);
  const showCloseBtn = sessionManager.sessions.length > 1;
  return (
    <div className="gpterm-tabs">
      <div className="gpterm-content">
        {sessionManager.sessions.map((session, index) => {
          const active = sessionManager.activeSessionIndex === index;
          return (
            <Tab
              key={`${index}`}
              session={session}
              showCloseBtn={showCloseBtn}
              active={active}
              onClick={() => {
                if (sessionManager.activeSessionIndex !== index) {  
                  runInAction(() => {
                    sessionManager.activeSessionIndex = index;
                  })
                }
              }}
              onClose={() => {
                runInAction(() => {
                  sessionManager.removeTab(index);
                })
              }}
            />
          );
        })}
      </div>
      <div className="gpterm-right">
        <button onClick={handleAddSession}>Add</button>
      </div>
    </div>
  );
});
