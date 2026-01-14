// components/meeting-room/ChatPanel.tsx
"use client";

import { useChat, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useState } from "react";

export function ChatPanel({ meetingId }: { meetingId: string }) {
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    // 1. Send via LiveKit data channel (instant)
    await send(message);

    // 2. Save to database (persistence)
    await fetch("/api/chat/messages", {
      method: "POST",
      body: JSON.stringify({ meetingId, message }),
    });

    setMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4">
        {chatMessages.map((msg) => (
          <div key={msg.timestamp}>
            <strong>{msg.from?.name}</strong>: {msg.message}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
}
