"use client";

import { useLocalParticipant } from "@livekit/components-react";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MessageSquare,
  PhoneOff,
  MonitorUp,
} from "lucide-react";

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

  const buttonClass =
    "p-4 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg group relative";
  const activeClass =
    "bg-gray-700/80 hover:bg-gray-600 text-white backdrop-blur-md";
  const inactiveClass =
    "bg-red-500/90 hover:bg-red-600 text-white backdrop-blur-md";

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {!isViewer && (
          <>
            {/* Microphone */}
            <button
              onClick={toggleMicrophone}
              className={`${buttonClass} ${
                localParticipant.isMicrophoneEnabled
                  ? activeClass
                  : inactiveClass
              }`}
              title={
                localParticipant.isMicrophoneEnabled
                  ? "Mute Microphone"
                  : "Unmute Microphone"
              }
            >
              {localParticipant.isMicrophoneEnabled ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </button>

            {/* Camera */}
            <button
              onClick={toggleCamera}
              className={`${buttonClass} ${
                localParticipant.isCameraEnabled ? activeClass : inactiveClass
              }`}
              title={
                localParticipant.isCameraEnabled
                  ? "Turn Off Camera"
                  : "Turn On Camera"
              }
            >
              {localParticipant.isCameraEnabled ? (
                <Camera className="w-5 h-5" />
              ) : (
                <CameraOff className="w-5 h-5" />
              )}
            </button>

            {/* Screen Share (Optional placeholder) */}
            {/* 
            <button className={`${buttonClass} bg-gray-700/80 hover:bg-gray-600 text-white backdrop-blur-md`}>
              <MonitorUp className="w-5 h-5" />
            </button> 
            */}

            <div className="w-px h-8 bg-white/10 mx-2" />

            {/* Chat */}
            <button
              onClick={onToggleChat}
              className={`${buttonClass} bg-indigo-600/90 hover:bg-indigo-500 text-white`}
              title="Toggle Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </>
        )}

        {isViewer && (
          <button
            onClick={onToggleChat}
            className={`${buttonClass} bg-indigo-600/90 hover:bg-indigo-500 text-white`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        )}

        <div className="w-px h-8 bg-white/10 mx-2" />

        {/* Leave */}
        <button
          onClick={onLeave}
          className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white px-6 w-auto flex items-center gap-2`}
          title="Leave Meeting"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="font-semibold text-sm">Leave</span>
        </button>
      </div>
    </div>
  );
}
