"use client";

import { LiveKitRoom } from "@livekit/components-react";
import { VideoLayout } from "./VideoLayout";
import { ControlBar } from "./ControlBar";
import { Chat } from "@livekit/components-react";
import { useState } from "react";

interface MeetingRoomProps {
  token: string;
  serverUrl: string;
  meetingId: string;
  onDisconnect: () => void;
}

export function MeetingRoom({
  token,
  serverUrl,
  meetingId,
  onDisconnect,
}: MeetingRoomProps) {
  const [showChat, setShowChat] = useState(false);

  return (
    <LiveKitRoom
      data-lk-theme="default"
      token={token}
      serverUrl={serverUrl}
      connect={true}
      onDisconnected={onDisconnect}
      className="h-screen flex flex-col"
    >
      <div className="flex-1 flex">
        {/* Video area */}
        <div className={showChat ? "flex-1" : "w-full"}>
          <VideoLayout />
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 border-l bg-gray-50">
            <Chat />
          </div>
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        meetingId={meetingId}
        onToggleChat={() => setShowChat(!showChat)}
        onLeave={onDisconnect}
      />
    </LiveKitRoom>
  );
}
