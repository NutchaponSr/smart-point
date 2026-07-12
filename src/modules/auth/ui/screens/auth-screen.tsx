import { UserRound } from "lucide-react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const AuthScreen = ({ title, children }: Props) => {
  return (
    <div className="text-center relative mt-0 w-100">
      <h1 className="text-2xl my-4 text-center font-bold leading-[40px] text-white">
        {title}
      </h1>

      {children}
    </div>
  );
}