"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/toast";
import Asidebar from "@/components/Asidebar";
import FormSection from "@/components/Form-section";
import { SessionData } from "@/types/type";
import { OrbitalLoader } from "@/components/ui/orbital-loader";
import JoinMeetingModal from "@/components/JoinMeetingModal";

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  createdAt: string;
  inviteCode?: string;
  publicCode?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [activeMode, setActiveMode] = useState<"plan" | "live" | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchMeetings();
    }
  }, [session]);

  // Click away listener for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get("/api/meetings");
      if (res.data.success) {
        // Filter out ended meetings - only show SCHEDULED and LIVE
        const activeMeetings = res.data.data.filter(
          (m: Meeting) => m.status === "SCHEDULED" || m.status === "LIVE",
        );
        setMeetings(activeMeetings);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    setMenuOpenId(null);
    try {
      const res = await axios.delete("/api/meetings/delete", {
        data: { meetingId },
      });
      if (res.data.success) {
        showToast("Meeting deleted successfully", "success", "top-right");
        fetchMeetings();
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
      showToast("Failed to delete meeting", "error", "top-right");
    }
  };

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success", "top-right");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#151515] text-white">
        <OrbitalLoader message="Loading..." />
      </div>
    );
  }

  if (!session || !session?.user) {
    return null;
  }

  const handleCreateMeeting = async (data: SessionData) => {
    setIsLoading(true);
    try {
      if (activeMode === "live") {
        // Use go-live endpoint for immediate start
        const response = await axios.post("/api/meetings/go-live", {
          title: data.name,
          participantEmails: data.inviteEmails,
        });

        if (response.data.success) {
          showToast("Live session created!", "success", "top-right");
          setCreatedMeeting(response.data.data);
        }
      } else {
        // Parse date (YYYY-MM-DD) and time (HH:MM AM/PM)
        const [year, month, day] = data.date.split("-").map(Number);
        const [time, period] = data.startTime.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        const dateObj = new Date(year, month - 1, day, hours, minutes);
        const scheduledAt = dateObj.toISOString();

        const response = await axios.post("/api/meetings/create", {
          title: data.name,
          scheduledAt,
          participantEmails: data.inviteEmails,
        });

        if (response.data.success) {
          showToast("Meeting scheduled successfully", "success", "top-right");
          fetchMeetings();
          setCreatedMeeting(response.data.data);
        }
      }
    } catch (error: any) {
      console.error("Error creating meeting:", error);
      showToast(
        error.response?.data?.message || "Error creating meeting",
        "error",
        "top-right",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCardDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return { month: "", day: "" };
    const date = new Date(dateStr);
    const month = date
      .toLocaleString("default", { month: "short" })
      .toUpperCase();
    const day = date.getDate();
    return { month, day };
  };

  const formatTimeRange = (meeting: Meeting) => {
    if (meeting.status === "LIVE") return "Live Now";
    if (!meeting.scheduledAt) return "No time set";

    const start = new Date(meeting.scheduledAt);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const format = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const now = new Date();
    const isToday =
      start.getDate() === now.getDate() &&
      start.getMonth() === now.getMonth() &&
      start.getFullYear() === now.getFullYear();
    const dayPrefix = isToday ? "Today" : start.toLocaleDateString();

    return `${dayPrefix} • ${format(start)} - ${format(end)}`;
  };

  const setEnterCodeActive = () => {
    setShowJoinModal(true);
  };

  return (
    <div className="flex min-h-screen bg-[#151515]">
      <Asidebar />
      <main className="flex-1 overflow-auto p-10 relative">
        <div className="flex justify-end items-center mb-12">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setEnterCodeActive()}
              className="bg-[#252525] hover:bg-[#333] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all border border-gray-800 shadow-xl flex items-center space-x-2 cursor-pointer"
            >
              <span>Join Public Meeting</span>
            </button>
            <button
              onClick={() => setActiveMode("live")}
              className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-xl flex items-center space-x-2 cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
              <span>Go Live</span>
            </button>
            <button
              onClick={() => setActiveMode("plan")}
              className="bg-[#252525] hover:bg-[#333] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all border border-gray-800 shadow-xl flex items-center space-x-2 cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
              <span>Plan meeting</span>
            </button>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Schedules :</h2>

          {meetings.length === 0 ? (
            <p className="flex items-center justify-center mt-10 text-gray-500">
              No projects scheduled. Click &quot;Plan meeting&quot; or &quot;Go
              Live&quot; to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {meetings.map((meeting) => {
                const { month, day } = getCardDateDisplay(
                  meeting.scheduledAt || meeting.createdAt,
                );
                return (
                  <div
                    key={meeting.id}
                    className="bg-[#1c1c1c] rounded-2xl overflow-hidden border border-gray-800/50 hover:border-gray-700 transition-all group relative"
                  >
                    {/* Three dots menu */}
                    <div
                      className="absolute top-4 right-4 z-10"
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
                        <div className="absolute right-0 mt-2 w-36 bg-[#252525] border border-gray-800 rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100">
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

                    <div
                      className="h-40 bg-[#2d2d3f] flex items-center justify-center cursor-pointer relative"
                      onClick={() => router.push(`/meeting/${meeting.id}`)}
                    >
                      <div className="text-center group-hover:scale-110 transition-transform duration-300">
                        <div className="text-[#a5a5ff] font-bold text-xl tracking-wider">
                          {month}
                        </div>
                        <div className="text-[#a5a5ff] font-bold text-3xl">
                          {day}
                        </div>
                      </div>
                      {meeting.status === "LIVE" && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 uppercase tracking-wider">
                          <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                          <span>Live</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-white font-bold text-lg mb-2 truncate">
                        {meeting.title}
                      </h3>
                      <p className="text-gray-400 text-xs font-medium">
                        {formatTimeRange(meeting)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Modal Overlay */}
        {activeMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1c1c1c] w-full max-w-2xl rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8">
                {createdMeeting ? (
                  <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-white">
                        {activeMode === "live"
                          ? "Ready to go live!"
                          : "Meeting Scheduled!"}
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Share these codes with your participants to join the
                        session.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                          Invite Code
                        </label>
                        <div className="flex bg-[#1c1c1c] p-4 rounded-xl border border-gray-800 items-center justify-between group">
                          <span className="text-2xl font-mono font-bold text-white tracking-widest">
                            {createdMeeting.inviteCode}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(createdMeeting.inviteCode)
                            }
                            className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg flex items-center space-x-2"
                          >
                            <span className="text-xs font-semibold">Copy</span>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                          Public Code
                        </label>
                        <div className="flex bg-[#1c1c1c] p-4 rounded-xl border border-gray-800 items-center justify-between group">
                          <span className="text-2xl font-mono font-bold text-white tracking-widest">
                            {createdMeeting.publicCode}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(createdMeeting.publicCode)
                            }
                            className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg flex items-center space-x-2"
                          >
                            <span className="text-xs font-semibold">Copy</span>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => {
                          if (activeMode === "live") {
                            router.push(`/meeting/${createdMeeting.id}`);
                          } else {
                            setActiveMode(null);
                            setCreatedMeeting(null);
                          }
                        }}
                        className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-xl"
                      >
                        {activeMode === "live" ? "Start Meeting Now" : "Done"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <FormSection
                    mode={activeMode}
                    onClose={() => setActiveMode(null)}
                    onSubmit={handleCreateMeeting}
                    isLoading={isLoading}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Join Meeting Modal */}
        {showJoinModal && (
          <JoinMeetingModal onClose={() => setShowJoinModal(false)} />
        )}
      </main>
    </div>
  );
}
