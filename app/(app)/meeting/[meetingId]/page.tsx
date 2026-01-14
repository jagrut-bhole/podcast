"use client";
import { useEffect, useState } from "react";
import { MeetingRoom } from "@/components/meeting-room/MeetingRoom";
import { OrbitalLoader } from "@/components/ui/orbital-loader";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";

export default function MeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }

    if (status === "authenticated" && meetingId) {
      fetchToken();
    }
  }, [status, meetingId]);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/livekit/token", {
        meetingId: meetingId,
      });

      if (response.data.success) {
        setToken(response.data.data.token);
        setServerUrl(response.data.data.serverUrl);
      }
    } catch (error) {
      console.error("Error fetching token:", error);
      setError("Failed to join the meeting. Please try again.");
      showToast(`Error fetching token: ${error}`, "error", "top-right");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await axios.patch(`/api/meetings/${meetingId}`, {
        action: "leave",
      });
    } catch (error) {
      console.error("Error leaving meeting:", error);
    }
    router.replace("/");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-950">
        <OrbitalLoader message="Connecting to meeting..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to Join Meeting</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/meeting")}
            className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Back to Join Page
          </button>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-950 via-indigo-950 to-slate-950">
        <OrbitalLoader message="Preparing meeting room..." />
      </div>
    );
  }

  return (
    <MeetingRoom
      token={token}
      serverUrl={serverUrl}
      meetingId={meetingId}
      onDisconnect={handleDisconnect}
    />
  );
}
