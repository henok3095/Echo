import React from "react";
import { UserCircle, LogOut } from "lucide-react";

export default function ProfilePopout({ username = "Henok", onLogout }) {
  return (
    <div className="absolute top-16 right-8 bg-[#23233a]/90 rounded-2xl shadow-xl p-6 border border-[#35355a] flex flex-col items-center min-w-[220px] z-50">
      <UserCircle className="w-14 h-14 text-[#EAB308] mb-2" />
      <span className="font-bold text-lg text-[#b3b3ff]">{username}</span>
      <button
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#5D5FEF] text-white rounded-xl font-semibold hover:bg-[#6c6cf5] transition"
        onClick={onLogout}
      >
        <LogOut className="w-5 h-5" /> Logout
      </button>
    </div>
  );
}
