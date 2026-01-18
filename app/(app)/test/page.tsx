"use client";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/toast";

export default function TestPage() {
  const { showToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Get screen capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: true, // System audio
      });

      // Get microphone audio
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Combine streams
      const tracks = [
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
        ...audioStream.getAudioTracks(),
      ];

      const combinedStream = new MediaStream(tracks);

      // Create MediaRecorder
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

        // Download the recording
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        // Stop all tracks
        combinedStream.getTracks().forEach((track) => track.stop());
        showToast("Recording saved", "success", "top-right");
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast("Recording started", "success", "top-right");
    } catch (error) {
      console.error("Error starting recording:", error);
      showToast("Failed to start recording", "error", "top-right");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      showToast("Recording stopped", "success", "top-right");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#151515] flex-col gap-20">
      {isRecording && (
        <div className="absolute top-10 bg-red-600 text-white px-6 py-3 rounded-full animate-pulse font-semibold">
          🔴 Recording...
        </div>
      )}

      <h1 className="text-white text-2xl font-bold">Jagrut</h1>

      <div className="flex gap-10">
        <button
          className="text-white bg-[#2563eb] border border-white rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={startRecording}
          disabled={isRecording}
        >
          {isRecording ? "Recording..." : "Start Recording"}
        </button>
        <button
          className="text-white bg-[#ef4444] border border-white rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={stopRecording}
          disabled={!isRecording}
        >
          Stop Recording
        </button>
      </div>
    </div>
  );
}
