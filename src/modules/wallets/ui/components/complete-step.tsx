import Image from "next/image";

import successImage from "../../../../../public/success.svg";

import { useTranslations } from "next-intl";

export const CompleteStep = () => {
  const t = useTranslations("wallet");

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-12 items-center justify-center bg-accent text-accent-foreground">
        <Image src={successImage} alt="Check" width={48} height={48} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-2xl">
          {t("complete-title")}
        </h1>
        <p className="mx-auto max-w-md text-base text-muted-foreground leading-relaxed">
          {t("complete-description")}
        </p>
      </div>
    </div>
  );
};