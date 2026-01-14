"use client";

import { useToast } from "@/components/ui/toast";

export default function Home() {
  const { showToast } = useToast();
  return (
    <div className="flex justify-center items-center min-h-screen">
      <h1 className="font-bold text-2xl">Hello Jags</h1>
      <div className="position-relative flex">
        <button
          onClick={() => showToast("Hello Jags!", "success", "top-right")}
        >
          Show Toast
        </button>
      </div>
    </div>
  );
}
