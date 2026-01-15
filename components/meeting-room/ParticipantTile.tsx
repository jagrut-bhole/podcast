"use client";

import { VideoTrack, AudioTrack } from "@livekit/components-react";
import { Participant, Track } from "livekit-client";

export function ParticipantTile({ participant }: { participant: Participant }) {
  return (
    <div className="relative h-full w-full bg-gray-800">
      {/* Video */}
      <VideoTrack
        trackRef={{
          participant,
          source: Track.Source.Camera,
          publication: participant.getTrackPublication(Track.Source.Camera),
        }}
        className="h-full w-full object-cover"
      />

      {/* Audio */}
      <AudioTrack
        trackRef={{
          participant,
          source: Track.Source.Microphone,
          publication: participant.getTrackPublication(Track.Source.Microphone),
        }}
      />

      {/* Name overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
        {participant.name || participant.identity}
      </div>

      {/* Muted indicator */}
      {participant.isMicrophoneEnabled === false && (
        <div className="absolute top-2 right-2 bg-red-500 p-2 rounded-full">
          🔇
        </div>
      )}
    </div>
  );
}
