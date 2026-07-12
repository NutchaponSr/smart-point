import { Logo } from "@/components/logo";
import { LanguageSelector } from "@/modules/auth/ui/components/language-selector";

interface Props {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col min-h-svh overflow-hidden pt-[70px] bg-[#131f24]">
      <header className="fixed top-0 w-full z-2">
        <nav className="flex items-center h-[70px] justify-between mx-auto max-w-[988px] p-0">
          <Logo className="text-white" />
        </nav>
      </header>
      <main className="flex items-center justify-center self-stretch w-full p-[30px] relative h-full">
        {children}
      </main>
      <footer className="items-center flex justify-center px-10 h-20 border-t-2 border-[#37464f]">
        <div className="overflow-hidden text-center text-base">
          <LanguageSelector />
        </div>
      </footer>
    </div>
  );
}