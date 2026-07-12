"use client";

import { SidebarContent } from "./sidebar-content";

export const Sidebar = () => {
  return (
    <aside className="fixed top-0 left-0 z-210 box-border hidden h-screen w-64 flex-col border-r-2 border-[#e5e5e5] bg-background px-4 text-[#afafaf] select-none md:flex">
      <SidebarContent />
    </aside>
  );
};
