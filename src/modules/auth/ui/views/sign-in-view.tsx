"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/convex/auth-client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const SignInView = () => {
  const router = useRouter();
  const t = useTranslations("auth.sign-in");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await authClient.signIn.username(
      {
        username: username,
        password: password,
      },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: (error) => {
          console.error(error);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex w-full flex-col gap-4 text-start text-base sm:gap-5">
        <fieldset className="flex min-w-0 flex-col gap-1.5 border-none">
          <legend className="relative mb-0 flex w-full min-w-0 items-center justify-between text-balance leading-snug font-bold [&_a]:font-normal">
            <Label
              htmlFor="username"
              className="sr-only inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30"
            >
              {t("employee-id")}
            </Label>
          </legend>
          <Input
            required
            id="username"
            type="text"
            inputMode="numeric"
            autoComplete="username"
            value={username}
            placeholder={t("employee-id-placeholder")}
            onChange={(e) => setUsername(e.target.value)}
            className="flex h-11 min-w-0 overflow-hidden rounded-lg border border-[#cfdceb] bg-white text-base text-[#3c3c3c] shadow-sm caret-[#1a5fd0] placeholder:text-[#9aa8b8] focus-visible:border-[#1a5fd0] sm:h-12"
          />
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-1.5 border-none">
          <legend className="relative mb-0 flex w-full min-w-0 items-center justify-between text-balance leading-snug font-bold [&_a]:font-normal">
            <Label
              htmlFor="password"
              className="sr-only inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30"
            >
              {t("password")}
            </Label>
          </legend>
          <Input
            required
            id="password"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={password}
            placeholder={t("password-placeholder")}
            onChange={(e) => setPassword(e.target.value)}
            className="flex h-11 min-w-0 overflow-hidden rounded-lg border border-[#cfdceb] bg-white text-base text-[#3c3c3c] shadow-sm caret-[#1a5fd0] placeholder:text-[#9aa8b8] focus-visible:border-[#1a5fd0] sm:h-12"
          />
          <span className="text-xs leading-relaxed text-[#8a97a8] sm:text-sm">
            {t("password-hint")}
          </span>
        </fieldset>

        <Button
          variant="primary"
          type="submit"
          className="mt-1 w-full rounded-lg border-b-0 bg-[#1a5fd0] hover:brightness-110 sm:mt-2"
          size="lg"
        >
          {t("submit")}
        </Button>
      </div>
    </form>
  );
};
