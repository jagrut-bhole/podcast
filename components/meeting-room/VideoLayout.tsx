"use client";

import { useParticipants } from "@livekit/components-react";
import { ParticipantTile } from "./ParticipantTile";

export function VideoLayout({ isViewer = false }: { isViewer?: boolean }) {
  const participants = useParticipants();

  const visibleParticipants = participants.filter((p) => {
    // If we are a viewer, we should not see ourselves (local participant)
    if (isViewer && p.isLocal) {
      return false;
    }

    // Filter out other viewers (both local and remote) based on metadata
    try {
      const metadata = p.metadata ? JSON.parse(p.metadata) : {};
      return !metadata.isViewer;
    } catch {
      return true;
    }
  });

  return (
    <div className="relative h-full bg-[#151515] pl-35 pr-35 p-5 pb-20">
      {visibleParticipants.length === 0 ? (
        <div className="flex items-center justify-center h-full text-white">
          <p className="text-lg text-gray-400">Waiting for host to join...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 h-full">
          {visibleParticipants.slice(0, 4).map((participant) => (
            <div
              key={participant.identity}
              className="aspect-video bg-gray-900 rounded-lg overflow-hidden w-full h-100"
            >
              <ParticipantTile participant={participant} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
