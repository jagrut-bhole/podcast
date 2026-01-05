"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

interface MeetingId {
  meetingId: string;
}

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params.meetingId as string;
  const [meeting, setMeeting] = useState<MeetingId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      if (!meetingId) return;

      try {
        setLoading(true);
        const response = await axios.post(`/api/meetings/${meetingId}`);
        setMeeting(response.data.data);
      } catch (error) {
        console.error("Error fetching meeting details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetingDetails();
  }, [meetingId]);

  if (loading) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }

  return (
    <div className="text-center p-8">
      <h1 className="text-white">MeetingID Details : {meetingId}</h1>
    </div>
  );
}
