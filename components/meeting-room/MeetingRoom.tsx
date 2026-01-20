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

  const [isRecording, setIsRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const chunkBufferRef = useRef<Blob[]>([]);
  const uploadStateRef = useRef<{
    uploadId: string | null;
    key: string | null;
    partNumber: number;
    uploadedParts: Array<{ etag: string; partNumber: number }>;
    totalSize: number;
    uploadedSize: number;
  }>({
    uploadId: null,
    key: null,
    partNumber: 1,
    uploadedParts: [],
    totalSize: 0,
    uploadedSize: 0,
  });
  const { showToast } = useToast();

  const CHUNK_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB buffer before uploading

  const uploadBufferedChunks = async () => {
    const { uploadId, key, partNumber, uploadedParts } = uploadStateRef.current;

    if (!uploadId || !key || chunkBufferRef.current.length === 0) {
      return;
    }

    try {
      // Combine buffered chunks into a single blob
      const combinedBlob = new Blob(chunkBufferRef.current, {
        type: "video/webm",
      });
      const chunkSize = combinedBlob.size;

      // Upload to S3
      const formData = new FormData();
      formData.append("uploadId", uploadId);
      formData.append("key", key);
      formData.append("partNumber", partNumber.toString());
      formData.append("chunk", combinedBlob);

      const response = await fetch("/api/upload-video/chunk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload chunk");
      }

      const { etag } = await response.json();

      // Update upload state
      uploadStateRef.current = {
        ...uploadStateRef.current,
        partNumber: partNumber + 1,
        uploadedParts: [...uploadedParts, { etag, partNumber }],
        uploadedSize: uploadStateRef.current.uploadedSize + chunkSize,
      };

      // Calculate and update progress
      const progress = Math.min(
        95,
        (uploadStateRef.current.uploadedSize /
          uploadStateRef.current.totalSize) *
          100,
      );
      setUploadProgress(progress);

      // Clear the buffer
      chunkBufferRef.current = [];
    } catch (error) {
      console.error("Error uploading chunk:", error);
      showToast("Upload error - retrying...", "error", "top-right");
      // Keep chunks in buffer for retry
    }
  };

  const startRecording = async () => {
    try {
      // Initialize upload session
      const initResponse = await fetch("/api/upload-video/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });

      if (!initResponse.ok) {
        throw new Error("Failed to initialize upload");
      }

      const { uploadId, key } = await initResponse.json();

      uploadStateRef.current = {
        uploadId,
        key,
        partNumber: 1,
        uploadedParts: [],
        totalSize: 0,
        uploadedSize: 0,
      };
      chunkBufferRef.current = [];
      setUploadProgress(0);

      const displayMediaOptions = {
        video: {
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 60 },
          displaySurface: "browser",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
        selfBrowserSurface: "include",
        preferCurrentTab: true,
        systemAudio: "include",
      } as any;

      const displayStream =
        await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      let combinedStream = displayStream;

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        const tracks = [
          ...displayStream.getVideoTracks(),
          ...displayStream.getAudioTracks(),
          ...audioStream.getAudioTracks(),
        ];
        combinedStream = new MediaStream(tracks);
      } catch (err) {
        console.warn("Could not get microphone stream for recording:", err);
      }

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 8000000,
        audioBitsPerSecond: 256000,
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          chunkBufferRef.current.push(event.data);
          uploadStateRef.current.totalSize += event.data.size;

          // Check if we've accumulated enough data to upload
          const bufferSize = chunkBufferRef.current.reduce(
            (acc, blob) => acc + blob.size,
            0,
          );

          if (bufferSize >= CHUNK_SIZE_THRESHOLD) {
            await uploadBufferedChunks();
          }
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          // Upload any remaining buffered chunks
          if (chunkBufferRef.current.length > 0) {
            await uploadBufferedChunks();
          }

          const { uploadId, key, uploadedParts } = uploadStateRef.current;

          if (uploadId && key && uploadedParts.length > 0) {
            // Complete the multipart upload
            const blob = new Blob(recordedChunksRef.current, {
              type: "video/webm",
            });

            const completeResponse = await fetch("/api/upload-video/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uploadId,
                key,
                parts: uploadedParts,
                meetingId,
                fileSizeBytes: blob.size,
                durationSeconds: null, // Could calculate if needed
              }),
            });

            if (!completeResponse.ok) {
              throw new Error("Failed to complete upload");
            }

            setUploadProgress(100);
            showToast(
              "Recording uploaded successfully",
              "success",
              "top-right",
            );
          } else {
            // Fallback to local download if upload failed
            const blob = new Blob(recordedChunksRef.current, {
              type: "video/webm",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `meeting-recording-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Recording saved locally", "success", "top-right");
          }
        } catch (error) {
          console.error("Error completing upload:", error);

          // Abort the upload on S3
          const { uploadId, key } = uploadStateRef.current;
          if (uploadId && key) {
            await fetch("/api/upload-video/abort", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uploadId, key, meetingId }),
            });
          }

          showToast(
            "Upload failed - recording saved locally",
            "error",
            "top-right",
          );

          // Fallback to local download
          const blob = new Blob(recordedChunksRef.current, {
            type: "video/webm",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `meeting-recording-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        } finally {
          combinedStream.getTracks().forEach((track) => track.stop());
          setIsRecording(false);
          setUploadProgress(0);
        }
      };

      // Start recording with 1-second timeslice for chunk generation
      mediaRecorder.start(1000);
      setIsRecording(true);

      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };
    } catch (error) {
      console.error("Error starting recording:", error);
      showToast("Failed to start recording", "error", "top-right");
    }
  };

  const stopRecording = async () => {
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
        <div className="absolute top-4 left-18 -translate-x-1/2 z-50 bg-red-600/90 text-white px-3 py-1.5 rounded-full animate-pulse flex items-center gap-2 shadow-lg backdrop-blur-md">
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
        uploadProgress={uploadProgress}
      />
    </LiveKitRoom>
  );
}
