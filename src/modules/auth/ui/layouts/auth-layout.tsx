import Image from "next/image";

import Logo from "../../../../../public/logo.svg";

import { Sparkle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: Props) => {
  return (
    <main className="relative flex min-h-svh w-full flex-col overflow-x-hidden bg-linear-to-br from-[#2b9fd9] via-[#35b3c9] to-[#4ecb9b]">
      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-10 sm:gap-12 sm:px-6 sm:py-12 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
        {/* Brand side */}
        <div className="flex w-full max-w-md shrink-0 flex-col items-center gap-6 text-center">
          <Image src={Logo} alt="Smart Point" width={100} height={100} />

          <div>
            <h1 className="flex flex-wrap items-baseline justify-center gap-1 text-4xl font-extrabold tracking-tight sm:text-5xl">
              <span className="text-white drop-shadow-md">SMART</span>
              <span className="flex items-baseline text-brand-orange drop-shadow-md">
                P
                <Sparkle
                  className="mx-0.5 h-8 w-8 self-center fill-white text-white"
                  aria-hidden="true"
                />
                int
              </span>
            </h1>
            <p className="mt-1 text-lg font-bold tracking-wide text-white drop-shadow-sm">
              Reward &amp; Recognition System
            </p>
          </div>

          <p className="text-balance text-lg font-medium leading-relaxed text-white sm:text-xl">
            พร้อมที่จะเปลี่ยน{' '}
            <span className="font-bold text-brand-mint">{"'ความสมาร์ท'"}</span>
            <br />
            ให้เป็น{' '}
            <span className="font-bold text-brand-orange">{"'รางวัล'"}</span>{' '}
            หรือยัง?
          </p>
        </div>

        <div className="flex w-full min-w-0 max-w-lg shrink-0 justify-center">
          {children}
        </div>
      </div>

      {/* Footer strips */}
      <footer className="relative z-10 mt-auto w-full shrink-0 border-t-2">
        <div className="flex items-center bg-brand-navy px-6 py-3">
          <p className="text-sm text-white">
            แจ้งปัญหาการใช้งานระบบโทร. 02-0808278
          </p>
        </div>
      </footer>
    </main>
  );
}