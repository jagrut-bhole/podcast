"use client";

import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";

interface ControlBarProps {
  meetingId: string;
  onToggleChat: () => void;
  onLeave: () => void;
  isViewer?: boolean;
}

export function ControlBar({
  meetingId,
  onToggleChat,
  onLeave,
  isViewer = false,
}: ControlBarProps) {
  const { localParticipant } = useLocalParticipant();

  const toggleMicrophone = () => {
    localParticipant.setMicrophoneEnabled(
      !localParticipant.isMicrophoneEnabled,
    );
  };

  const toggleCamera = () => {
    localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
  };

  return (
    <div className="h-16 bg-gray-800 flex items-center justify-center gap-4 px-4">
      {!isViewer && (
        <>
          {/* Microphone */}
          <button
            onClick={toggleMicrophone}
            className={`p-3 rounded-full ${
              localParticipant.isMicrophoneEnabled
                ? "bg-gray-700"
                : "bg-red-600"
            }`}
          >
            {localParticipant.isMicrophoneEnabled ? "🎤" : "🔇"}
          </button>

          {/* Camera */}
          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full ${
              localParticipant.isCameraEnabled ? "bg-gray-700" : "bg-red-600"
            }`}
          >
            {localParticipant.isCameraEnabled ? "📹" : "📵"}
          </button>

          {/* Chat */}
          <button
            onClick={onToggleChat}
            className="p-3 rounded-full bg-gray-700"
          >
            💬
          </button>
        </>
      )}

      {/* Leave */}
      <button onClick={onLeave} className="p-3 rounded-full bg-red-600">
        📞 Leave
      </button>
    </div>
  );
}
