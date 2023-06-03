import { useCallback } from "react";
import { Tab } from "./tab";
import { SessionManager } from "@pkg/models/session_manager";
import { observer } from "mobx-react";
import { runInAction } from "mobx";
import { MdAdd } from "react-icons/md";
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
    <div className="gpterm-tabs gpterm-noselect">
      <div className="gpterm-content">
        {sessionManager.sessions.map((session, index) => {
          const active = sessionManager.activeSessionIndex === index;
          const last = index === sessionManager.sessions.length - 1;
          return (
            <Tab
              key={`${index}`}
              session={session}
              showCloseBtn={showCloseBtn}
              active={active}
              last={last}
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
        <button onClick={handleAddSession}>
          <MdAdd />
        </button>
      </div>
    </div>
  );
});
