"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useToast } from "@/components/ui/toast";

interface JoinMeetingModalProps {
  onClose: () => void;
}

export function JoinMeetingModal({ onClose }: JoinMeetingModalProps) {
  const [publicCode, setPublicCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (publicCode.length !== 6) {
      showToast("Please enter a 6-digit code", "error", "top-right");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("/api/meetings/join/random", {
        publicCode: publicCode.toUpperCase(),
      });

      if (response.data.success) {
        showToast(response.data.message, "success", "top-right");

        // Store viewer token and serverUrl in sessionStorage
        sessionStorage.setItem(
          `meeting_${response.data.data.meeting.id}_token`,
          response.data.data.token,
        );
        sessionStorage.setItem(
          `meeting_${response.data.data.meeting.id}_serverUrl`,
          response.data.data.serverUrl,
        );

        // Navigate to meeting page with viewer flag
        router.push(`/meeting/${response.data.data.meeting.id}?viewer=true`);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Failed to join meeting";
      showToast(errorMessage, "error", "top-right");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length <= 6) {
      setPublicCode(value);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1c1c1c] w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Join Meeting</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meeting Code
              </label>
              <input
                type="text"
                value={publicCode}
                onChange={handleCodeChange}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 bg-[#252525] border border-gray-700 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-white transition-colors"
                maxLength={6}
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter the 6-character code provided by the meeting host
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || publicCode.length !== 6}
                className="flex-1 px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Joining...
                  </>
                ) : (
                  "Join Meeting"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default JoinMeetingModal;
