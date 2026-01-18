"use client";

import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { VideoLayout } from "./VideoLayout";
import { ControlBar } from "./ControlBar";
import { ChatPanel } from "./ChatPanel";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/toast";

interface MeetingRoomProps {
  token: string;
  serverUrl: string;
  meetingId: string;
  onDisconnect: () => void;
  onEndForAll?: () => void;
  isHost?: boolean;
  isViewer?: boolean;
}

export function MeetingRoom({
  token,
  serverUrl,
  meetingId,
  onDisconnect,
  onEndForAll,
  isHost = false,
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

  // Recording Logic
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const { showToast } = useToast(); // Ensure useToast is imported if not already available in scope? Wait, it's not imported.

  const startRecording = async () => {
    try {
      // Configuration to nudge the browser to select the current tab
      // Note: Browsers mandate a manual selection for security, but we can set defaults.
      const displayMediaOptions = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
          displaySurface: "browser", // Prefer browser tab
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        selfBrowserSurface: "include", // Include current tab in list
        preferCurrentTab: true, // Ask browser to default to current tab
        systemAudio: "include",
      } as any; // Type casting for newer properw-futies

      const displayStream =
        await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      // If user provided user media (mic), mix it in
      // Note: displayStream usually includes system audio if 'Share Audio' is checked
      let combinedStream = displayStream;

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        // Combine video from screen and audio from mic + system
        const tracks = [
          ...displayStream.getVideoTracks(),
          ...displayStream.getAudioTracks(), // System audio
          ...audioStream.getAudioTracks(), // Mic audio
        ];
        combinedStream = new MediaStream(tracks);
      } catch (err) {
        console.warn("Could not get microphone stream for recording:", err);
        // Continue with just display stream if mic fails
      }

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meeting-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        combinedStream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        showToast("Recording saved", "success", "top-right");
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast("Recording started", "success", "top-right");

      // Stop recording if user stops sharing via browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (error) {
      console.error("Error starting recording:", error);
      showToast("Failed to start recording", "error", "top-right");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <LiveKitRoom
      data-lk-theme="default"
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={false}
      audio={false}
      onDisconnected={handleDisconnected}
      onError={handleError}
      className="h-screen flex flex-col bg-[#151515]"
    >
      {/* Video and audio will be controlled by ControlBar toggles */}
      <RoomAudioRenderer />
      <div className="flex-1 flex">
        {/* Video area */}
        <div className={showChat ? "flex-1" : "w-full"}>
          <VideoLayout isViewer={isViewer} />
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-96 border-l border-white/5 bg-[#121212] flex flex-col shadow-2xl z-20">
            <ChatPanel meetingId={meetingId} />
          </div>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-4 py-1.5 rounded-full animate-pulse flex items-center gap-2 shadow-lg backdrop-blur-md">
          <div className="w-2 h-2 bg-white rounded-full" />
          <span className="text-sm font-semibold tracking-wide">
            Recording...
          </span>
        </div>
      )}

      {/* Control bar */}
      <ControlBar
        meetingId={meetingId}
        onEndForAll={onEndForAll}
        isHost={isHost}
        onToggleChat={() => setShowChat(!showChat)}
        onLeave={onDisconnect}
        isViewer={isViewer}
        isRecording={isRecording}
        onToggleRecording={toggleRecording}
      />
    </LiveKitRoom>
  );
}
