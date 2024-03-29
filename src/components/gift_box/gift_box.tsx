import { useContext, memo } from "react";
import TabBtn from "@pkg/components/tab_btn";
import {
  MdOutlineInfo,
  MdOutlineAnalytics,
  MdOutlineChat,
} from "react-icons/md";
import { GoGitBranch } from "react-icons/go";
import { IntelligenceTab } from "./intelligence_tab";
import { ChatTab } from "./chat_tab";
import { GitTab } from "./git_tab";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import { AppContext } from "@pkg/contexts/app_context";
import classes from "./gift_box.module.css";

interface GiftBoxTabIntf {
  name: string;
  icon: React.ReactNode;
  renderer: () => React.ReactNode;
}

const tabsDefinitions: GiftBoxTabIntf[] = [
  {
    name: "Info",
    icon: <MdOutlineInfo />,
    renderer: () => <IntelligenceTab />,
  },
  {
    name: "Git",
    icon: <GoGitBranch />,
    renderer: () => <GitTab />,
  },
  {
    name: "Chat",
    icon: <MdOutlineChat />,
    renderer: () => <ChatTab />,
  },
  {
    name: "Analytics",
    icon: <MdOutlineAnalytics />,
    renderer: () => <div>Analytics</div>,
  },
];

const GiftBox = memo(() => {
  const appState = useContext(AppContext)!;
  const activeIndex = useBehaviorSubject(appState.giftBoxActiveIndex$);

  return (
    <div className={classes.giftbox}>
      <div className={classes.tabs}>
        <div className="inner">
          {tabsDefinitions.map((tab, index) => {
            return (
              <TabBtn
                key={tab.name}
                unactive={activeIndex !== index}
                onClick={() => {
                  appState.giftBoxActiveIndex$.next(index);
                }}
              >
                {tab.icon}
              </TabBtn>
            );
          })}
        </div>
      </div>
      <div className={classes.content}>
        {tabsDefinitions[activeIndex].renderer()}
      </div>
    </div>
  );
});

export default GiftBox;
