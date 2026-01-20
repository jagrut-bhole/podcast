"use client";

import { useLocalParticipant } from "@livekit/components-react";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MessageSquare,
  PhoneOff,
  Disc,
  Square,
} from "lucide-react";
import { useState } from "react";
import { EndMeetingModal } from "./EndMeetingModal";

interface ControlBarProps {
  meetingId: string;
  onToggleChat: () => void;
  onLeave: () => void;
  onEndForAll?: () => void;
  isHost?: boolean;
  isViewer?: boolean;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  uploadProgress?: number;
}

export function ControlBar({
  onToggleChat,
  onLeave,
  onEndForAll,
  isHost = false,
  isViewer = false,
  isRecording = false,
  onToggleRecording,
  uploadProgress = 0,
}: ControlBarProps) {
  const { localParticipant } = useLocalParticipant();
  const [showEndModal, setShowEndModal] = useState(false);

  const toggleMicrophone = () => {
    localParticipant.setMicrophoneEnabled(
      !localParticipant.isMicrophoneEnabled,
    );
  };

  const toggleCamera = () => {
    localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
  };

  const handleLeaveClick = () => {
    if (isHost) {
      setShowEndModal(true);
    } else {
      onLeave();
    }
  };

  const handleEndForAll = () => {
    setShowEndModal(false);
    if (onEndForAll) {
      onEndForAll();
    }
  };

  const handleJustLeave = () => {
    setShowEndModal(false);
    onLeave();
  };

  const buttonClass =
    "p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg group relative";
  const activeClass =
    "bg-gray-700/80 hover:bg-gray-600 text-white backdrop-blur-md";
  const inactiveClass =
    "bg-red-500/90 hover:bg-red-600 text-white backdrop-blur-md";

  return (
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <Mic className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
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
                <Camera className="w-4 h-4" />
              ) : (
                <CameraOff className="w-4 h-4" />
              )}
            </button>

            <div className="w-px h-8 bg-white/10 mx-2" />

            {/* Chat */}
            <button
              onClick={onToggleChat}
              className={`${buttonClass} bg-indigo-600/90 hover:bg-indigo-500 text-white`}
              title="Toggle Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </>
        )}

        {isViewer && (
          <button
            onClick={onToggleChat}
            className={`${buttonClass} bg-indigo-600/90 hover:bg-indigo-500 text-white`}
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}

        {onToggleRecording && !isViewer && (
          <>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <button
              onClick={onToggleRecording}
              className={`${buttonClass} ${
                isRecording
                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  : "bg-white/5 hover:bg-white/10 text-white"
              } relative`}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Disc className="w-4 h-4" />
              )}

              {/* Upload Progress Ring */}
              {isRecording && uploadProgress > 0 && (
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity="0.2"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${uploadProgress} 100`}
                    strokeLinecap="round"
                    className="text-green-400"
                  />
                </svg>
              )}
            </button>

            {/* Upload Progress Text */}
            {isRecording && uploadProgress > 0 && (
              <span className="text-xs text-gray-400 font-mono">
                {Math.round(uploadProgress)}%
              </span>
            )}
          </>
        )}

        <div className="w-px h-8 bg-white/10 mx-2" />

        {/* Leave - with popover */}
        <div className="relative">
          <button
            onClick={handleLeaveClick}
            className={`${buttonClass} bg-red-600 hover:bg-red-700 text-white px-6 w-auto flex items-center gap-2`}
            title={isHost ? "End Meeting" : "Leave Meeting"}
          >
            <PhoneOff className="w-4 h-4" />
            <span className="font-semibold text-sm">
              {isHost ? "End" : "Leave"}
            </span>
          </button>

          {/* End Meeting Popover */}
          <EndMeetingModal
            isOpen={showEndModal}
            onClose={() => setShowEndModal(false)}
            onLeave={handleJustLeave}
            onEndForAll={handleEndForAll}
          />
        </div>
      </div>
    </div>
  );
}
