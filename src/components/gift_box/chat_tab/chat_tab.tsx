import { useEffect, useRef, useState, useCallback } from "react";
import "./chat_tab.scss";

interface ChatMessage {
  sender: string;
  msg: string;
}

export function ChatTab() {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, [textAreaRef.current]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      const msg = e.currentTarget.value;
      setChatHistory((prev) => [{
        sender: "Me",
        msg,
      }, ...prev]);
      e.currentTarget.value = "";
    }
  }, [chatHistory, setChatHistory]);

  return (
    <div className="gpterm-chat-tab">
      <div className="gpterm-chat-history">
        {chatHistory.map((msg, index) => {
          return <div className="gpterm-chat-msg" key={`${index}`}><b>{msg.sender}: </b>{msg.msg}</div>;
        })}
      </div>
      <div className="gpterm-chat-input-container">
        <textarea ref={textAreaRef} onKeyDown={handleKeyDown} />
      </div>
    </div>
  )
}
