"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import axios from "axios";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState(null);
  const { showToast } = useToast();

  const fetchProfile = async () => {
    if (!session?.user?.id) {
      showToast("User not authenticated", "error", "center");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(`/api/users/${session.user.id}`);
      setProfileData(response.data);
      showToast("Profile fetched successfully!", "success", "center");
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast("Failed to fetch profile!!", "error", "center");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen space-y-4 p-8">
      <h1 className="text-2xl font-bold mb-4">Profile Test Page</h1>

      <div className="bg-neutral-800 p-6 rounded-lg space-y-2 w-full max-w-md">
        <p className="text-sm text-neutral-400">User ID:</p>
        <p className="font-mono text-sm break-all">{session.user.id}</p>

        <p className="text-sm text-neutral-400 mt-4">Email:</p>
        <p className="text-sm">{session.user.email}</p>

        <p className="text-sm text-neutral-400 mt-4">Name:</p>
        <p className="text-sm">{session.user.name}</p>
      </div>

      <button
        onClick={fetchProfile}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 text-white font-medium py-2 px-6 rounded-full"
      >
        {loading ? "Loading..." : "Fetch Profile from API"}
      </button>

      {profileData && (
        <div className="bg-neutral-800 p-6 rounded-lg space-y-2 w-full max-w-md mt-4">
          <p className="text-sm text-neutral-400">Profile Data from API:</p>
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      )}

      <button
        onClick={() =>
          showToast("Operation successful.", "success", "top-right")
        }
        className="bg-neutral-100 hover:bg-opacity-90 text-black font-medium py-2 px-4 rounded-full mt-4"
      >
        Show Success Toast
      </button>
    </div>
  );
}
