import {
  Home,
  Calendar,
  Sparkles,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Asidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarOpen");
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  const navItems = [
    { id: "home", label: "Home", icon: Home, href: "/home" },
    { id: "schedule", label: "Schedule", icon: Calendar, href: "/schedule" },
  ];

  return (
    <aside
      className={`bg-[#0d0d0d] h-screen flex flex-col transition-all duration-300 border-r border-gray-900 ${isSidebarOpen ? "w-64" : "w-20"}`}
    >
      <div className="p-6 flex items-center justify-between">
        {isSidebarOpen ? (
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1 rounded">
              <svg
                className="w-4 h-4 text-black"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 14l4-4 4 4" />
                <path d="M12 10l4 4 4-4" />
              </svg>
            </div>
            <span className="text-white font-bold tracking-widest text-lg">
              PODCAST
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="bg-white p-1 rounded">
              <svg
                className="w-4 h-4 text-black"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 14l4-4 4 4" />
                <path d="M12 10l4 4 4-4" />
              </svg>
            </div>
          </div>
        )}
        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {!isSidebarOpen && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-white transition-colors border border-gray-800 p-2 rounded-lg bg-[#1a1a1a]"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Sidebar Nav */}
      <nav className="flex-1 px-4 space-y-2 mt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center cursor-pointer ${isSidebarOpen ? "px-4" : "justify-center"} py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-[#1a1a1a] text-white"
                  : "text-gray-400 hover:text-white hover:bg-[#111]"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {isSidebarOpen && (
                <span className="ml-4 font-bold text-sm tracking-wide">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="px-4 py-6 space-y-4">
        <div className="h-px bg-gray-900 w-full"></div>

        {/* Footer Nav */}
        <div className="space-y-2">
          {[
            { label: "What's New", icon: Sparkles, dot: true },
            { label: "Settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.label}
              className={`cursor-pointer w-full flex items-center ${isSidebarOpen ? "px-4" : "justify-center"} py-2 text-gray-400 hover:text-white transition-all group relative`}
            >
              <item.icon className="w-5 h-5" />
              {isSidebarOpen && (
                <span className="ml-4 font-bold text-sm">{item.label}</span>
              )}
              {item.dot && (
                <div
                  className={`absolute ${isSidebarOpen ? "right-4" : "top-1 right-1"} w-2 h-2 rounded-full bg-purple-500`}
                ></div>
              )}
            </button>
          ))}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          {/* Profile Menu Popup */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-0 mb-4 w-72 bg-[#1c1c1c] border border-gray-800 rounded-2xl shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Menu Items */}
              <div className="p-2 space-y-1">
                <button className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-[#252525] transition-colors group text-white">
                  <div className="w-5 h-5 flex items-center justify-center opacity-80">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="ml-4 text-sm font-bold">Watch a demo</span>
                </button>

                <button className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-[#252525] transition-colors group text-white">
                  <div className="w-5 h-5 flex items-center justify-center opacity-80">
                    <svg
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <span
                    onClick={() => handleSignOut()}
                    className="ml-4 text-sm font-bold"
                  >
                    Log out
                  </span>
                </button>
              </div>
            </div>
          )}

          <div
            className={`flex items-center ${isSidebarOpen ? "px-4" : "justify-center"} pt-2`}
          >
            <div
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-xl cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="mb-1">😊</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
