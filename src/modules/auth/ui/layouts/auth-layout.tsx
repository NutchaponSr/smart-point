import { Logo } from "@/components/logo";
import { LanguageSelector } from "@/modules/auth/ui/components/language-selector";

interface Props {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: Props) => {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#f0fbff]">
      <div className="pointer-events-none absolute inset-0 motion-reduce:[&_*]:!animate-none" aria-hidden>
        <div className="absolute inset-0 animate-[auth-wash_14s_ease-in-out_infinite] bg-linear-to-br from-[#ddf4ff] via-[#f0fbff] to-[#d7ffb8]" />
        <div className="absolute -top-28 -right-24 size-[28rem] animate-[auth-blob-a_9s_ease-in-out_infinite] rounded-full bg-[#58cc02]/35 blur-3xl" />
        <div className="absolute -bottom-36 -left-20 size-[26rem] animate-[auth-blob-b_11s_ease-in-out_infinite] rounded-full bg-[#1cb0f6]/40 blur-3xl" />
        <div className="absolute top-[42%] left-1/2 size-72 -translate-x-1/2 animate-[auth-blob-c_8s_ease-in-out_infinite] rounded-full bg-[#ffc800]/30 blur-3xl" />
        <div className="absolute inset-0 animate-[auth-dots_20s_linear_infinite] bg-[radial-gradient(#84d8ff_1.25px,transparent_1.25px)] bg-size-[22px_22px] opacity-40" />
      </div>

      <header className="fixed top-0 z-10 w-full border-b-2 bg-white/75 backdrop-blur-md">
        <nav className="mx-auto flex h-[70px] max-w-[988px] items-center justify-between p-0">
          <Logo />
        </nav>
      </header>

      <main className="relative z-1 flex w-full flex-1 items-center justify-center self-stretch p-[30px] pt-[100px] pb-10">
        <div className="w-full max-w-md animate-[auth-rise_0.55s_ease-out]">
          {children}
        </div>
      </main>

      <footer className="relative z-1 flex h-20 items-center justify-center border-t-2 bg-white/70 px-10 backdrop-blur-sm">
        <div className="overflow-hidden text-center text-base">
          <LanguageSelector />
        </div>
      </footer>

      <style>{`
        @keyframes auth-wash {
          0%, 100% { opacity: 1; filter: hue-rotate(0deg); }
          50% { opacity: 0.92; filter: hue-rotate(8deg); }
        }
        @keyframes auth-blob-a {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.9; }
          33% { transform: translate(-28px, 22px) scale(1.12); opacity: 1; }
          66% { transform: translate(18px, -30px) scale(0.94); opacity: 0.85; }
        }
        @keyframes auth-blob-b {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.95; }
          40% { transform: translate(36px, -24px) scale(1.1); opacity: 1; }
          70% { transform: translate(-20px, 28px) scale(0.92); opacity: 0.8; }
        }
        @keyframes auth-blob-c {
          0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.85; }
          50% { transform: translate(calc(-50% + 24px), -36px) scale(1.18); opacity: 1; }
        }
        @keyframes auth-dots {
          0% { background-position: 0 0; opacity: 0.35; }
          50% { opacity: 0.5; }
          100% { background-position: 22px 22px; opacity: 0.35; }
        }
        @keyframes auth-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
