"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session || !session.user) {
    return null; // Will redirect via useEffect
  }

  async function handleLogout() {
    await signOut({ redirect: false });
    router.replace("/signin");
    router.refresh();
  }

  return (
    <div className="text-center p-8">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="text-lg">Welcome, {session.user.name}!</p>
      <p className="text-gray-600">Email: {session.user.email}</p>
      <div className="mt-5">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md"
        >
          Sign out
        </button>
      </div>
      <div>
        <Image
          src={session.user.image!}
          alt="Profile Picture"
          width={100}
          height={100}
          className="rounded-full mt-4 mx-auto"
        />
      </div>
    </div>
  );
}
