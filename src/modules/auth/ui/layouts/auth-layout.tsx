import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { AppVersion } from "@/components/app-version";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { getAppVersion } from "@/lib/app-version";
import { LanguageSelector } from "@/modules/auth/ui/components/language-selector";

interface Props {
  children: React.ReactNode;
}

function SmartPointTitle() {
  return (
    <div className="mt-4 w-full text-center sm:mt-8 landscape:max-lg:mt-2">
      <h1 className="inline-flex flex-wrap items-center justify-center gap-x-2 text-[2rem] font-black leading-none tracking-tight text-[#0b4ea2] drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] sm:text-5xl lg:text-[3.25rem] landscape:max-lg:text-[1.65rem]">
        <span
          style={{
            WebkitTextStroke: "2px rgba(255,255,255,0.85)",
            paintOrder: "stroke fill",
          }}
        >
          SMART
        </span>
        <span className="inline-flex items-center gap-0.5">
          <span
            style={{
              WebkitTextStroke: "2px rgba(255,255,255,0.85)",
              paintOrder: "stroke fill",
            }}
          >
            P
          </span>
          <span
            className="relative mx-0.5 inline-flex size-[0.72em] items-center justify-center rounded-full bg-[#0b4ea2] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9)]"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="size-[55%] text-[#f5c518]" fill="currentColor">
              <path d="M12 2.5l2.6 6.2 6.7.6-5.1 4.4 1.5 6.5L12 16.8 6.3 20.2l1.5-6.5-5.1-4.4 6.7-.6L12 2.5z" />
            </svg>
          </span>
          <span
            style={{
              WebkitTextStroke: "2px rgba(255,255,255,0.85)",
              paintOrder: "stroke fill",
            }}
          >
            int
          </span>
        </span>
      </h1>
      <p className="mt-1.5 text-sm font-semibold text-[#0b4ea2] sm:mt-2 sm:text-base landscape:max-lg:mt-1 landscape:max-lg:text-xs">
        Reward &amp; Recognition System
      </p>
    </div>
  );
}

export const AuthLayout = async ({ children }: Props) => {
  const t = await getTranslations("auth");
  const version = await getAppVersion();

  return (
    <div className="relative flex min-h-svh w-full min-w-0 flex-col overflow-x-clip overflow-y-auto bg-[#1a5fd0] landscape:max-lg:min-h-0 landscape:max-lg:h-svh landscape:max-lg:overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:**:animate-none!" aria-hidden>
        <div className="absolute inset-0 animate-[auth-wash_14s_ease-in-out_infinite] bg-linear-to-br from-[#ddf4ff] via-[#f0fbff] to-[#d7ffb8]" />
        <div className="absolute -top-20 -right-16 size-48 animate-[auth-blob-a_9s_ease-in-out_infinite] rounded-full bg-[#58cc02]/35 blur-3xl sm:-top-28 sm:-right-24 sm:size-[28rem]" />
        <div className="absolute -bottom-24 -left-12 size-44 animate-[auth-blob-b_11s_ease-in-out_infinite] rounded-full bg-[#1cb0f6]/40 blur-3xl sm:-bottom-36 sm:-left-20 sm:size-[26rem]" />
        <div className="absolute top-[42%] left-1/2 size-48 -translate-x-1/2 animate-[auth-blob-c_8s_ease-in-out_infinite] rounded-full bg-[#ffc800]/30 blur-3xl sm:size-72" />
        <BackgroundBeams />
      </div>

      <main className="relative z-1 flex w-full flex-1 flex-col justify-center px-4 py-10 sm:px-8 sm:py-16 lg:px-12 xl:px-16 landscape:max-lg:justify-center landscape:max-lg:px-4 landscape:max-lg:py-3">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16 landscape:max-lg:grid-cols-2 landscape:max-lg:gap-4 landscape:max-lg:items-center">
          {/* Brand column */}
          <section className="flex w-full animate-[auth-rise_0.55s_ease-out] justify-center landscape:max-lg:min-w-0">
            <div className="flex w-full max-w-lg flex-col items-center text-center">
              <Image
                src="/logo.svg"
                alt="SmartPoint Logo"
                width={100}
                height={100}
                className="mx-auto size-16 sm:size-[100px] landscape:max-lg:size-12"
                priority
              />
              <SmartPointTitle />
              <div className="mt-4 w-full max-w-md space-y-1 text-center text-sm font-medium leading-relaxed text-[#3c3c3c] sm:mt-8 sm:text-base landscape:max-lg:mt-2 landscape:max-lg:hidden">
                <p>{t("brand.line1")}</p>
                <p>{t("brand.line2")}</p>
                <p>{t("brand.line3")}</p>
                <p>{t("brand.line4")}</p>
              </div>
            </div>
          </section>

          {/* Login card */}
          <section className="w-full animate-[auth-rise_0.65s_ease-out] justify-self-center lg:justify-self-end landscape:max-lg:min-w-0 landscape:max-lg:justify-self-stretch">
            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border-2 border-border bg-white/90 px-5 py-6 shadow-[0_18px_50px_rgba(10,50,120,0.28)] backdrop-blur-sm sm:px-8 sm:py-10 landscape:max-lg:max-h-[calc(100svh-4.5rem)] landscape:max-lg:overflow-y-auto landscape:max-lg:px-4 landscape:max-lg:py-4">
              <div className="relative z-1">{children}</div>
            </div>
          </section>
        </div>
      </main>

      <footer
        className="relative z-1 flex min-h-12 shrink-0 items-center justify-center border-t-2 border-border bg-white/95 px-4 py-2 sm:min-h-16 sm:px-10 sm:py-3 landscape:max-lg:min-h-10 landscape:max-lg:py-1.5"
        aria-label={t("language.label")}
      >
        <div className="flex w-full items-center justify-between gap-2 overflow-hidden text-center text-sm sm:text-base landscape:max-lg:text-xs">
          <LanguageSelector />
          <AppVersion version={version} />
        </div>
      </footer>

      <style>{`
        @keyframes auth-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes auth-wash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.92; }
        }
        @keyframes auth-blob-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 16px) scale(1.08); }
        }
        @keyframes auth-blob-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(24px, -18px) scale(1.06); }
        }
        @keyframes auth-blob-c {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(calc(-50% + 16px), -20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};
