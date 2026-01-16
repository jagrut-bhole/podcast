"use client";

import { VideoTrack, AudioTrack } from "@livekit/components-react";
import { Participant, Track } from "livekit-client";
import { MicOff, User } from "lucide-react";

export function ParticipantTile({ participant }: { participant: Participant }) {
  const isVideoEnabled = participant.isCameraEnabled;
  const isAudioEnabled = participant.isMicrophoneEnabled;
  const displayName = participant.name || participant.identity || "Guest";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const cameraPublication = participant.getTrackPublication(
    Track.Source.Camera,
  );
  const micPublication = participant.getTrackPublication(
    Track.Source.Microphone,
  );

  return (
    <div className="relative h-full w-full bg-[#202020] overflow-hidden group">
      {/* Video */}
      {isVideoEnabled && cameraPublication ? (
        <VideoTrack
          trackRef={{
            participant,
            source: Track.Source.Camera,
            publication: cameraPublication,
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#252525]">
          <div className="w-24 h-24 rounded-full bg-[#303030] flex items-center justify-center border-2 border-white/10 shadow-xl">
            <span className="text-3xl font-bold text-gray-400 select-none tracking-widest">
              {initials}
            </span>
          </div>
        </div>
      )}

      {/* Audio */}
      {micPublication && (
        <AudioTrack
          trackRef={{
            participant,
            source: Track.Source.Microphone,
            publication: micPublication,
          }}
        />
      )}

      {/* Overlays */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none transition-opacity duration-300">
        <div className="flex items-center justify-between">
          <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white text-sm font-medium border border-white/10 flex items-center gap-2">
            <User className="w-3 h-3 text-white/70" />
            {displayName} {participant.isLocal && "(You)"}
          </div>

          {/* Muted indicator */}
          {!isAudioEnabled && (
            <div className="w-8 h-8 flex items-center justify-center bg-red-500/90 backdrop-blur-md rounded-full shadow-lg">
              <MicOff className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
