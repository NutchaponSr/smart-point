"use client";

import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

import TH from "../../../../../public/TH.svg";
import EN from "../../../../../public/US.svg";

import { routing } from "@/i18n/routing";
import { authClient } from "@/lib/convex/auth-client";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AvatarProfileHeader } from "../components/avatar-profile-header";

const sections = ["account", "language"] as const;
type Section = (typeof sections)[number];

const LOCALE_OPTIONS = [
  {
    value: "th" as const,
    label: "ไทย",
    description: "Thai",
    image: TH,
  },
  {
    value: "en" as const,
    label: "English",
    description: "อังกฤษ",
    image: EN,
  },
];

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] bg-background">
      <h2 className="border-b-2 border-[#e5e5e5] px-4 py-3 text-sm font-bold text-[#777]">
        {title}
      </h2>
      <div className="grid">{children}</div>
    </section>
  );
}

function SidebarLink({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full cursor-pointer px-4 py-3 text-left text-base font-bold transition-colors",
        active
          ? "bg-[#ddf4ff] text-[#1cb0f6]"
          : "text-[#3c3c3c] hover:bg-[#f7f7f7]",
      )}
    >
      {children}
    </button>
  );
}

export const SettingsView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as (typeof routing.locales)[number];

  const [section, setSection] = useState<Section>("account");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const onLocaleChange = (newLocale: (typeof routing.locales)[number]) => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
      fetchOptions: {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
        },
        onError: () => {
          toast.error("เปลี่ยนรหัสผ่านไม่สำเร็จ");
        },
        onSettled: () => {
          setIsSubmitting(false);
        },
      },
    });
  };

  const onSignOut = () => {
    setIsSigningOut(true);
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
        onSettled: () => {
          setIsSigningOut(false);
        },
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-[988px] px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="z-0 min-w-0 flex-1">
          {section === "account" ? (
            <div className="grid gap-8">
              <header>
                <h1 className="text-2xl font-bold text-[#3c3c3c] sm:text-3xl">
                  บัญชี
                </h1>
              </header>

              <AvatarProfileHeader />

              <section className="grid gap-1">
                <h2 className="border-b-2 border-[#e5e5e5] pb-3 text-xl font-bold text-[#3c3c3c]">
                  เปลี่ยนรหัสผ่าน
                </h2>

                <form onSubmit={onSubmit} className="grid gap-6 pt-4">
                  <fieldset className="grid gap-2 border-none">
                    <Label
                      htmlFor="current-password"
                      className="text-base font-bold text-[#3c3c3c]"
                    >
                      รหัสผ่านปัจจุบัน
                    </Label>
                    <Input
                      required
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </fieldset>

                  <fieldset className="grid gap-2 border-none">
                    <Label
                      htmlFor="new-password"
                      className="text-base font-bold text-[#3c3c3c]"
                    >
                      รหัสผ่านใหม่
                    </Label>
                    <Input
                      required
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </fieldset>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto sm:justify-self-start"
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "บันทึกรหัสผ่าน"}
                  </Button>
                </form>
              </section>
            </div>
          ) : (
            <div className="grid gap-8">
              <header>
                <h1 className="text-2xl font-bold text-[#3c3c3c] sm:text-3xl">
                  ภาษา
                </h1>
              </header>

              <section className="grid gap-1">
                <h2 className="border-b-2 border-[#e5e5e5] pb-3 text-xl font-bold text-[#3c3c3c]">
                  เลือกภาษาที่แสดงผล
                </h2>

                <div className="grid gap-3 pt-4 sm:grid-cols-2">
                  {LOCALE_OPTIONS.map((option) => {
                    const selected = locale === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onLocaleChange(option.value)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors",
                          selected
                            ? "border-[#84d8ff] bg-[#ddf4ff]"
                            : "border-[#e5e5e5] bg-background hover:bg-[#f7f7f7]",
                        )}
                      >
                        <Image
                          src={option.image}
                          alt={option.label}
                          width={32}
                          height={32}
                          className="size-8 rounded-full"
                        />
                        <span className="grid min-w-0 gap-0.5">
                          <span
                            className={cn(
                              "text-base font-bold",
                              selected ? "text-[#1cb0f6]" : "text-[#3c3c3c]",
                            )}
                          >
                            {option.label}
                          </span>
                          <span className="text-sm text-[#777]">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>

        <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:z-1 lg:w-[272px] lg:shrink-0 lg:self-start">
          <SettingsCard title="บัญชี">
            <SidebarLink
              active={section === "account"}
              onClick={() => setSection("account")}
            >
              บัญชี
            </SidebarLink>
            <SidebarLink
              active={section === "language"}
              onClick={() => setSection("language")}
            >
              ภาษา
            </SidebarLink>
          </SettingsCard>

          <SettingsCard title="การสนับสนุน">
            <a
              href="mailto:support@smart-point.local"
              className="block px-4 py-3 text-base font-bold text-[#3c3c3c] transition-colors hover:bg-[#f7f7f7]"
            >
              ศูนย์ช่วยเหลือ
            </a>
          </SettingsCard>

          <Button
            type="button"
            size="lg"
            variant="primaryOutline"
            className="w-full border-2 border-[#e5e5e5] border-b-4 font-bold text-[#1cb0f6] hover:bg-[#f7f7f7]"
            disabled={isSigningOut}
            onClick={onSignOut}
          >
            {isSigningOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </Button>
        </aside>
      </div>
    </div>
  );
};
