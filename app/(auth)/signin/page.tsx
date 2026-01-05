"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1>Sign In</h1>

      <button
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="px-6 py-3 bg-white border rounded-lg text-black"
      >
        Sign in with Google
      </button>

      <button
        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        className="px-6 py-3 bg-gray-900 text-white rounded-lg"
      >
        Sign in with GitHub
      </button>
    </div>
  );
}

// http://localhost:3000/signin
