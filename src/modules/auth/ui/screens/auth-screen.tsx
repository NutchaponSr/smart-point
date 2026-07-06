import { UserRound } from "lucide-react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const AuthScreen = ({ children }: Props) => {
  return (
    <div className="mx-auto w-full min-w-0 max-w-lg rounded-lg border-2 bg-card p-6 sm:p-12">
      <h2 className="text-center text-3xl font-extrabold text-brand-navy sm:text-4xl">
        ยินดีต้อนรับ
      </h2>
      <p className="mt-3 text-center text-base font-semibold text-brand-navy/80 sm:text-lg">
        กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
      </p>

      {children}
    </div>
  );
}