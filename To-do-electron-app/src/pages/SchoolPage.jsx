import React from "react";

import TaskCard from "../components/TaskCard";

export default function SchoolPage({ tasks, onAddTask, username, date }) {
  return (
    <main className="flex-1 p-10 overflow-y-auto flex flex-col gap-8 bg-gradient-to-br from-[#2e2e4d] to-[#23233a]">

      <section className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-7">
        {tasks.map((task, idx) => (
          <TaskCard key={idx} {...task} />
        ))}
      </section>
      <button
        className="bg-gradient-to-r from-[#4f4fd7] to-[#6c6cf5] text-white px-10 py-4 rounded-xl cursor-pointer text-lg font-bold shadow-lg transition hover:scale-105 mt-8 w-fit"
        onClick={onAddTask}
      >
        + Add New School Task
      </button>
    </main>
  );
}
