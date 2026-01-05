"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function MeetingPage() {
  const [meeting, setMeeting] = useState<string>("");

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        const response2 = await axios.post("/api/meetings");
        setMeeting(response2.data.message);
      } catch (error) {
        console.error("Error fetching meeting details:", error);
      }
    };

    fetchMeetingDetails();
  }, []);
  return (
    <div className="text-center p-8">
      <h1 className="text-white">Meeting Details : {meeting}</h1>
    </div>
  );
}
