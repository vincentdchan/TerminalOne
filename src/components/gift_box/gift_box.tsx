import TabBtn from "@pkg/components/tab_btn";
import {
  MdOutlineInfo,
  MdOutlineAnalytics,
  MdOutlineChat,
} from "react-icons/md";
import { GoGitBranch } from "react-icons/go";
import { IntelligenceTab } from "./intelligence_tab";
import { ChatTab } from "./chat_tab";
import { AppState } from "@pkg/models/app_state";
import { useBehaviorSubject } from "@pkg/hooks/observable";
import "./gift_box.scss";

export interface GiftBoxProps {
  appState: AppState;
}

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
    renderer: () => <div>Git</div>,
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

function GiftBox(props: GiftBoxProps) {
  const { appState } = props;

  const activeIndex = useBehaviorSubject(appState.giftBoxActiveIndex$);

  return (
    <div className="t1-giftbox">
      <div className="t1-giftbox-tabs">
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
      <div className="t1-giftbox-content">
        {tabsDefinitions[activeIndex].renderer()}
      </div>
    </div>
  );
}

export default GiftBox;
