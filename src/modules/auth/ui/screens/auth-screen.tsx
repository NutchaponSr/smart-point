import Image from "next/image";

import Logo from "../../../../../public/logo.svg";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const AuthScreen = ({ title, children }: Props) => {
  return (
    <div className="relative mt-0 w-100 text-center flex flex-col items-center">
      <Image src={Logo} alt="Logo" width={100} height={100} />
      <h1 className="my-4 text-center text-2xl font-bold leading-[40px] text-[#3c3c3c]">
        {title}
      </h1>

      {children}
    </div>
  );
}