"use client";

import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const [loading, setLoading] = useState<boolean>(false);

  const { showToast } = useToast();

  const handleSignInWithGoogle = () => {
    setLoading(true);
    try {
      signIn("google", { callbackUrl: "/home" });
      showToast("Successfully signed in with Google", "success", "top-right");
    } catch (error) {
      console.error("SignIn error while signing in with Google", error);
      showToast("Failed to sign in with Google", "error", "top-right");
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGithub = () => {
    setLoading(true);
    try {
      signIn("github", { callbackUrl: "/home" });
      showToast("Successfully signed in with Github", "success", "top-right");
    } catch (error) {
      console.error("SignIn error while signing in with Github", error);
      showToast("Failed to sign in with Github", "error", "top-right");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#151515]">
      <h1 className="text-white text-2xl font-bold">Sign In</h1>

      <button
        onClick={handleSignInWithGoogle}
        className="px-6 py-3 bg-white border rounded-lg text-black"
      >
        Sign in with Google
      </button>

      <button
        onClick={handleSignInWithGithub}
        className="px-6 py-3 bg-black text-white rounded-lg flex items-center gap-2"
      >
        <Github className="w-5 h-5" />
        Sign in with GitHub
      </button>
    </div>
  );
}

// http://localhost:3000/signin
