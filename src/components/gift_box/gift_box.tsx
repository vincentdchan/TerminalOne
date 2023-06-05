import TabBtn from "@pkg/components/tab_btn";
import { MdOutlineInfo, MdOutlineAnalytics } from "react-icons/md";
import "./gift_box.scss";

const GiftBox = () => {
  return (
    <div className="gpterm-giftbox">
      <div className="gpterm-gifbox-tabs">
        <TabBtn>
          <MdOutlineInfo />
        </TabBtn>
        <TabBtn>
          <MdOutlineAnalytics />
        </TabBtn>
      </div>
    </div>
  )
};

export default GiftBox;
