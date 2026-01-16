"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { OrbitalLoader } from "@/components/ui/orbital-loader";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ProfileCard } from "@/components/auth/profilecard";

interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserdetails(session.user.id);
    } else if (status === "authenticated") {
      // If authenticated but no ID (shouldn't happen with proper auth setup)
      setIsLoading(false);
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [session, status]);

  const fetchUserdetails = async (userId: string) => {
    try {
      const response = await axios.get(`/api/users/${userId}`);

      if (response.data.success) {
        setUser(response.data.data);
      } else {
        setError("Failed to load user data");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setError("Failed to fetch user details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // TODO: Implement actual delete API call
    // const response = await axios.delete(`/api/users/${user?.id}`);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Mock delay
    console.log("Account deletion confirmed");
    alert(
      "This is a demo. Account deletion is not yet connected to the backend.",
    );
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0d0d0d]">
        <OrbitalLoader />
        <p className="text-gray-500 mt-4 text-sm animate-pulse">
          Loading profile...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0d0d0d] text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-8 text-center tracking-tight">
          Your Profile
        </h1>
        {user && <ProfileCard user={user} onDelete={handleDeleteAccount} />}
      </div>
    </div>
  );
}
