import Image from "next/image";

import successImage from "../../../../../public/success.png";

export const CompleteStep = () => {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-12 items-center justify-center bg-accent text-accent-foreground">
        <Image src={successImage} alt="Check" width={36} height={36} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          การส่งเงินสำเร็จ
        </h1>
        <p className="mx-auto max-w-md text-base text-muted-foreground leading-relaxed">
          รายการของคุณถูกบันทึกแล้ว สามารถตรวจสอบได้ในประวัติธุรกรรม
        </p>
      </div>
    </div>
  );
};