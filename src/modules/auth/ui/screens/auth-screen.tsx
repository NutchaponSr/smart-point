import Image from "next/image";

import Logo from "../../../../../public/logo.svg";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const AuthScreen = ({ title, children }: Props) => {
  return (
    <div className="relative mt-0 flex w-full max-w-full flex-col items-center px-1 text-center sm:px-0">
      <Image
        src={Logo}
        alt="Logo"
        width={100}
        height={100}
        className="size-20 sm:size-[100px]"
        priority
      />
      <h1 className="my-3 max-w-full text-balance text-xl font-bold leading-snug text-[#3c3c3c] sm:my-4 sm:text-2xl sm:leading-[40px]">
        {title}
      </h1>

      <div className="w-full">{children}</div>
    </div>
  );
};
