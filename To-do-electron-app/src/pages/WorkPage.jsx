import React, { useState } from "react";
import { useAuthStore } from "../store/index.jsx";

import TaskCard from "../components/TaskCard";

export default function WorkPage({ tasks, onAddTask, username, date }) {
  const { user } = useAuthStore();
  const [showVerifyBanner, setShowVerifyBanner] = useState(true);
  const isUnverified = user && !user.confirmed_at;

  return (
    <main className="flex-1 p-10 overflow-y-auto flex flex-col gap-8 bg-gradient-to-br from-[#2e2e4d] to-[#23233a]">
      {/* Verification Banner */}
      {isUnverified && showVerifyBanner && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-lg mb-4 flex items-center justify-between shadow">
          <div>
            <strong>Verify your account:</strong> Please check your email and click the verification link to unlock all features. <span className="ml-2">Didn’t get it? Check your spam folder or resend from your profile.</span>
          </div>
          <button
            className="ml-4 text-yellow-700 hover:underline font-bold"
            onClick={() => setShowVerifyBanner(false)}
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-7">
        {tasks.map((task, idx) => (
          <TaskCard key={idx} {...task} />
        ))}
      </section>
      <button
        className="bg-gradient-to-r from-[#4f4fd7] to-[#6c6cf5] text-white px-10 py-4 rounded-xl cursor-pointer text-lg font-bold shadow-lg transition hover:scale-105 mt-8 w-fit"
        onClick={onAddTask}
      >
        + Add New Work Task
      </button>
    </main>
  );
}
