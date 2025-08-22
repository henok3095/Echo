import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

const TASK_LISTS = [
  { name: "School", icon: "📚" },
  { name: "Work", icon: "💼" },
  { name: "Side Projects", icon: "🧠" },
  { name: "Daily", icon: "📅" },
];

export default function SidebarPage() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#23233a] to-[#181826] items-center justify-center">
      <Sidebar lists={TASK_LISTS} onSelect={setSelected} selected={selected} />
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-extrabold text-[#b3b3ff] mb-4 drop-shadow-lg">Sidebar Component Demo</h2>
        <div className="text-lg text-[#b3b3ff] bg-[#23233a] px-8 py-4 rounded-xl shadow-lg">
          Selected List: <span className="font-bold text-white">{TASK_LISTS[selected].name}</span>
        </div>
      </div>
    </div>
  );
}
