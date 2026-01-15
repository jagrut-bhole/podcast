"use client";

import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { VideoLayout } from "./VideoLayout";
import { ControlBar } from "./ControlBar";
import { Chat } from "@livekit/components-react";
import { useState } from "react";

interface MeetingRoomProps {
  token: string;
  serverUrl: string;
  meetingId: string;
  onDisconnect: () => void;
  isViewer?: boolean;
}

export function MeetingRoom({
  token,
  serverUrl,
  meetingId,
  onDisconnect,
  isViewer = false,
}: MeetingRoomProps) {
  const [showChat, setShowChat] = useState(false);

  const handleError = (error: Error) => {
    console.error("LiveKit room error:", error);
  };

  const handleDisconnected = (reason?: any) => {
    console.log("Disconnected from room, reason:", reason);
    onDisconnect();
  };

  return (
    <LiveKitRoom
      data-lk-theme="default"
      token={token}
      serverUrl={serverUrl}
      connect={true}
      onDisconnected={handleDisconnected}
      onError={handleError}
      className="h-screen flex flex-col bg-[#151515]"
    >
      <RoomAudioRenderer />
      <div className="flex-1 flex">
        {/* Video area */}
        <div className={showChat ? "flex-1" : "w-full"}>
          <VideoLayout />
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 border-l bg-[#1a1a1a]">
            <Chat />
          </div>
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        meetingId={meetingId}
        onToggleChat={() => setShowChat(!showChat)}
        onLeave={onDisconnect}
        isViewer={isViewer}
      />
    </LiveKitRoom>
  );
}
