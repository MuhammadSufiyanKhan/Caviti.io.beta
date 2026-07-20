"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="w-10 h-10 rounded-full bg-slate-700 animate-pulse" />
    );
  }

  if (!user) {
    return null;
  }

  const initial = user.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all cursor-pointer text-white font-bold text-sm shadow-lg"
        title={user.email}
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">{user.email}</p>
          </div>

          <div className="border-t border-slate-700 px-4 py-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
