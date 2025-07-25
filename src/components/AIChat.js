import React, { useState } from "react";

// The onSend prop is a function that calls your backend
export default function AIChat({ onSend }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setChat([...chat, { from: "user", text: message }]);
    setIsLoading(true);
    try {
      const aiReply = await onSend(message);
      setChat((c) => [...c, { from: "ai", text: aiReply }]);
    } catch (e) {
      setChat((c) => [...c, { from: "ai", text: "AI service error." }]);
    }
    setIsLoading(false);
    setMessage("");
  };

  return (
    <>
      <div className="aiChatTitle">AI Assistant</div>
      <div className="aiChatBox">
        {chat.map((msg, i) => (
          <div
            key={i}
            className={`aiChatMessage ${msg.from === "ai" ? "ai" : "user"}`}
          >
            <div className="aiBubble">{msg.text}</div>
          </div>
        ))}
        {isLoading && (
          <div className="aiChatMessage ai">
            <div className="aiBubble">
              <i>Typing…</i>
            </div>
          </div>
        )}
      </div>
      <div className="aiChatInputArea">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask AI...."
        />
        <button onClick={handleSend} disabled={isLoading}>
          Send
        </button>
      </div>
    </>
  );
}