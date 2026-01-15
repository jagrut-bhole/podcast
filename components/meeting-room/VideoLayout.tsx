"use client";

import { useParticipants } from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";

export function VideoLayout() {
  const participants = useParticipants();

  // Separate local and remote
  const remoteParticipants = participants.filter((p) => !p.isLocal);
  const localParticipant = participants.find((p) => p.isLocal);

  return (
    <div className="relative h-full bg-[#151515]">
      {/* Remote participant (main view) */}
      {remoteParticipants[0] && (
        <div className="h-full">
          <ParticipantTile participant={remoteParticipants[0]} />
        </div>
      )}

      {/* Local participant (PIP corner) */}
      {localParticipant && (
        <div className="absolute bottom-4 right-4 w-64 h-48 rounded-lg overflow-hidden shadow-lg">
          <ParticipantTile participant={localParticipant} />
        </div>
      )}

      {/* Waiting message */}
      {remoteParticipants.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p>Waiting for other participant...</p>
        </div>
      )}
    </div>
  );
}
