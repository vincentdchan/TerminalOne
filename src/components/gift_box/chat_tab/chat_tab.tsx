import { useEffect, useRef, useState, useCallback } from "react";
import classes from "./chat_tab.module.css";

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter") {
        const msg = e.currentTarget.value;
        setChatHistory((prev) => [
          {
            sender: "Me",
            msg,
          },
          ...prev,
        ]);
        e.currentTarget.value = "";
      }
    },
    [chatHistory, setChatHistory]
  );

  return (
    <div className={classes.chatTab}>
      <div className={classes.chatHistory}>
        {chatHistory.map((msg, index) => {
          return (
            <div className={classes.chatMsg} key={`${index}`}>
              <b>{msg.sender}: </b>
              {msg.msg}
            </div>
          );
        })}
      </div>
      <div className={classes.chatInputContainer}>
        <textarea ref={textAreaRef} onKeyDown={handleKeyDown} />
      </div>
    </div>
  );
}
