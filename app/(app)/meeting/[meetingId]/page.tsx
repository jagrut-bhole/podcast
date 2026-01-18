"use client";
import { useEffect, useState } from "react";
import { MeetingRoom } from "@/components/meeting-room/MeetingRoom";
import { OrbitalLoader } from "@/components/ui/orbital-loader";
import axios from "axios";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";

export default function MeetingPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const searchParams = useSearchParams();
  const isViewer = searchParams.get("viewer") === "true";

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

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
      // For viewers, check if token is already in sessionStorage
      if (isViewer) {
        const storedToken = sessionStorage.getItem(
          `meeting_${meetingId}_token`,
        );
        const storedServerUrl = sessionStorage.getItem(
          `meeting_${meetingId}_serverUrl`,
        );

        if (storedToken && storedServerUrl) {
          setToken(storedToken);
          setServerUrl(storedServerUrl);
          setIsHost(false);
          setLoading(false);
          return;
        } else {
          setError("Invalid viewer session. Please rejoin the meeting.");
          setLoading(false);
          return;
        }
      }

      // Fetch meeting details to check if user is host
      const meetingResponse = await axios.get(`/api/meetings/${meetingId}`);
      if (meetingResponse.data.success) {
        const meeting = meetingResponse.data.data;
        setIsHost(meeting.host.id === session?.user?.id);
      }

      const response = await axios.post("/api/livekit/token", {
        meetingId: meetingId,
      });

      console.log("Token response:", response.data);

      if (response.data.success) {
        setToken(response.data.data.token);
        setServerUrl(response.data.data.serverUrl);
        console.log("Token and serverUrl set successfully");
        console.log("ServerURL:", response.data.data.serverUrl);
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
    console.log("Disconnect triggered - handleDisconnect called");
    try {
      await axios.patch(`/api/meetings/${meetingId}`, {
        action: "leave",
      });
    } catch (error) {
      console.error("Error leaving meeting:", error);
    }
    router.replace("/home");
  };

  const handleEndForAll = async () => {
    console.log("End for all triggered");
    try {
      const response = await axios.post(`/api/meetings/end-meeting-for-all`, {
        meetingId,
      });
      if (response.data.success) {
        showToast("Meeting ended for all participants", "success", "top-right");
      }
    } catch (error) {
      console.error("Error ending meeting:", error);
      showToast("Failed to end meeting", "error", "top-right");
    }
    router.replace("/home");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#151515] text-white">
        <OrbitalLoader message="Connecting to meeting..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#151515] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unable to Join Meeting</h1>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/home")}
            className="px-6 py-2 bg-[#151515] rounded-lg hover:bg-[#1515151] border border-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="flex text-white items-center justify-center min-h-screen bg-[#151515]">
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
      onEndForAll={handleEndForAll}
      isHost={isHost}
      isViewer={isViewer}
    />
  );
}
