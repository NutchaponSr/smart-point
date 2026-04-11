import Link from "next/link";

import { navigations } from "@/constants";

import { Logo } from "@/components/logo";

export const Sidebar = () => {
  return (
    <nav className="flex flex-col overflow-x-hidden overflow-y-auto bg-black text-white lg:static lg:w-52 dark:text-foreground">
      <div className="override grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 text-lg leading-6 lg:hidden">
        <Logo />
      </div>
      <header className="hidden lg:grid p-6">
        <Logo className="lg:px-0" />
      </header>
      <div className="grow flex flex-col overflow-x-hidden overflow-y-auto">
        <section className="mb-12 hidden lg:grid">
          {navigations.map((navigation, index) => (
            <Link key={index} href={navigation.href} className="flex items-center truncate border-y-2 border-white/50 border-b-transparent px-6 py-4 no-underline last:border-b-white/50 hover:text-pink dark:border-foreground/50 dark:border-b-transparent dark:last:border-b-foreground/50 min-h-15">
              <navigation.icon className="size-5" />
              <span className="ml-4">{navigation.label}</span>
            </Link>
          ))}
        </section>
      </div>
      <footer className="mt-auto hidden lg:grid">
        <div className="cursor-pointer outline-none all-unset focus-visible:outline-none group flex items-center justify-between overflow-hidden border-t-2 border-white/50 px-6 py-4 all-unset hover:text-accent dark:border-foreground/50">
          User Button
        </div>
      </footer>
    </nav>
  );
}