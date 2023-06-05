import TabBtn from "@pkg/components/tab_btn";
import { MdOutlineInfo, MdOutlineAnalytics } from "react-icons/md";
import { IntelligenceTab } from "./intelligence_tab";
import { AppState } from "@pkg/models/app_state";
import "./gift_box.scss";
import { useBehaviorSubject } from "@pkg/hooks/observable";

export interface GiftBoxProps {
  appState: AppState;
}

interface GiftBoxTabIntf {
  name: string;
  icon: React.ReactNode;
}

const tabsDefinitions: GiftBoxTabIntf[] = [
  {
    name: "Info",
    icon: <MdOutlineInfo />,
  },
  {
    name: "Analytics",
    icon: <MdOutlineAnalytics />,
  },
];

function GiftBox(props: GiftBoxProps) {
  const { appState } = props;

  const activeIndex = useBehaviorSubject(appState.giftBoxActiveIndex$);

  return (
    <div className="gpterm-giftbox">
      <div className="gpterm-giftbox-tabs">
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
      <div className="gpterm-giftbox-content">
        <IntelligenceTab appState={appState} />
      </div>
    </div>
  );
}

export default GiftBox;
