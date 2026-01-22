"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/toast";
import Asidebar from "@/components/Asidebar";
import { OrbitalLoader } from "@/components/ui/orbital-loader";

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  createdAt: string;
  endedAt: string | null;
}

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchEndedMeetings();
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchEndedMeetings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/meetings");
      if (res.data.success) {
        const endedMeetings = res.data.data.filter(
          (m: Meeting) => m.status === "ENDED",
        );
        setMeetings(endedMeetings);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPodcast = async (meetingId: string) => {
    setLoading(true);

    try {
      const response = await axios.get("/api/download-meeting", {
        params: {
          meetingId,
        },
      });

      if (response.data.success) {
        showToast("Podcast Downloaded", "success", "top-right");
        const url = response.data.data.downloadUrl;

        const link = document.createElement("a");
        link.href = url;
        link.download = `podcast-${meetingId}.webm`;
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading podcast:", error);
      showToast("Failed to generate download link", "error", "top-right");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    setMenuOpenId(null);
    try {
      const res = await axios.delete("/api/meetings/delete", {
        data: { meetingId },
      });
      if (res.data.success) {
        showToast("Podcast deleted successfully", "success", "top-right");
        fetchEndedMeetings();
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
      showToast("Failed to delete podcast", "error", "top-right");
    }
  };

  const getMonthAndDay = (dateStr: string | null) => {
    if (!dateStr) return { month: "", day: "" };
    const d = new Date(dateStr);
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = d.getDate();
    return { month, day };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#151515] text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#151515] text-white">
        <OrbitalLoader message="Loading Meetings..." />
      </div>
    )
  }

  if (!session || !session.user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#151515]">
      <Asidebar />
      <main className="flex-1 overflow-auto p-10 relative">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Podcasts
          </h1>
          <p className="text-gray-500 mt-2">
            View and manage your finished podcast recordings
          </p>
        </div>

        {meetings.length === 0 ? (
          <div className="py-24 text-center animate-in fade-in duration-300">
            <div className="text-gray-700 text-xl font-black italic">
              No podcasts recorded yet.
            </div>
            <p className="text-gray-600 mt-2 text-sm">
              Your finished meetings will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {meetings.map((meeting) => {
              const { month, day } = getMonthAndDay(
                meeting.endedAt || meeting.scheduledAt || meeting.createdAt,
              );
              return (
                <div
                  key={meeting.id}
                  className="bg-[#121212] rounded-2xl p-5 border border-gray-800 shadow-lg hover:border-gray-700 transition-all group  hover:scale-[1.01] relative"
                >
                  {/* Three dots menu */}
                  <div
                    className="absolute top-6 right-6 z-10"
                    ref={menuOpenId === meeting.id ? menuRef : null}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(
                          menuOpenId === meeting.id ? null : meeting.id,
                        );
                      }}
                      className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        fill="currentColor"
                      >
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {menuOpenId === meeting.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-[#252525] border border-gray-800 rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMeeting(meeting.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-400/10 flex items-center space-x-2"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="aspect-video bg-[#25223a] rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
                    <div className="text-center flex flex-col items-center">
                      <div className="text-[#9b9bcc] font-bold text-2xl tracking-widest leading-none mb-1">
                        {month}
                      </div>
                      <div className="text-[#9b9bcc] font-bold text-5xl leading-none">
                        {day}
                      </div>
                    </div>
                    {/* Ended badge */}
                    <div className="absolute top-3 left-3 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Ended
                    </div>
                  </div>
                  <div className="space-y-1 pl-1">
                    <h3 className="text-white font-bold text-xl truncate tracking-wide">
                      {meeting.title}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm font-medium">
                      <span>
                        {
                          formatDate(
                            meeting.endedAt ||
                              meeting.scheduledAt ||
                              meeting.createdAt,
                          ).split(",")[0]
                        }
                      </span>
                      <span className="mx-2 font-bold opacity-30">•</span>
                      <span>
                        {formatTime(
                          meeting.endedAt ||
                            meeting.scheduledAt ||
                            meeting.createdAt,
                        )}
                      </span>
                    </div>
                    <div className="text-black text-sm font-medium p-3">
                      <button
                        onClick={() => handleDownloadPodcast(meeting.id)}
                        className="px-4 py-2 bg-white rounded-2xl hover:bg-gray-200 transition-all hover:cursor-pointer"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
