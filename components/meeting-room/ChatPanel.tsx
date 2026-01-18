"use client";
import { useChat } from "@livekit/components-react";
import { useState, useEffect, useRef } from "react";
import { Send, X, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function ChatPanel({
  meetingId,
  onClose,
}: {
  meetingId: string;
  onClose?: () => void;
}) {
  const { chatMessages, send, isSending } = useChat();
  const [message, setMessage] = useState("");
  const [historyMessages, setHistoryMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/chat/history?meetingId=${meetingId}`);
        const data = await res.json();
        if (data.success) {
          setHistoryMessages(data.data);
        } else {
          console.error("Failed to load chat history:", data.message);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    fetchHistory();
  }, [meetingId]);

  // Combine history and live messages
  const allMessages = [
    ...historyMessages.map((msg) => ({
      id: msg.id,
      message: msg.message,
      senderName: msg.user.name || msg.user.email || "Unknown",
      timestamp: new Date(msg.sentAt).getTime(),
      isHistory: true,
    })),
    ...chatMessages.map((msg) => ({
      id: msg.id || msg.timestamp.toString(),
      message: msg.message,
      senderName: msg.from?.name || msg.from?.identity || "Unknown",
      timestamp: msg.timestamp,
      isHistory: false,
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages.length]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      // 1. Send via LiveKit data channel (instant)
      await send(message);

      // 2. Save to database (persistence)
      // Fire and forget, but log error
      fetch("/api/chat/messages", {
        method: "POST",
        body: JSON.stringify({ meetingId, message }),
      }).catch((err) => {
        console.error("Failed to save chat to DB:", err);
        // Optional: showToast("Failed to save chat history", "error");
      });

      setMessage("");
    } catch (e) {
      console.error("Failed to send message via LiveKit:", e);
      showToast(
        "Failed to send message. Please try again.",
        "error",
        "top-right",
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#181818]/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-sm tracking-wide">Meeting Chat</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Message history */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
      >
        {allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm italic">
            <p>No messages yet</p>
            <p className="text-xs mt-1">Say hello to everyone!</p>
          </div>
        )}

        {allMessages.map((msg, index) => {
          return (
            <div
              key={`${msg.id}-${index}`}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-xs text-indigo-300 truncate max-w-30">
                  {msg.senderName}
                </span>
                <span className="text-[10px] text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="bg-[#1e1e1e] p-3 rounded-2xl rounded-tl-none border border-white/5 text-sm leading-relaxed text-gray-200 shadow-sm break-words">
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-[#181818] border-t border-white/5">
        <div className="relative flex items-center">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            disabled={isSending}
            className="w-full bg-[#0a0a0a] text-white placeholder-gray-500 text-sm px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 border border-white/10 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className="absolute right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
