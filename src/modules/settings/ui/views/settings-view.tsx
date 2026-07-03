"use client";

import { toast } from "sonner";
import { useState } from "react";

import { authClient } from "@/lib/convex/auth-client";

import { Main } from "@/components/main";
import { Sort } from "@/components/sort";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const sortValues = ["account", "appearance"] as const;

export const SettingsView = () => {
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sort, setSort] = useState<typeof sortValues[number]>(sortValues[0]);

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
          toast.success("Password reset successfully");
        },
        onError: () => {
          toast.error("Failed to reset password");
        },
        onSettled: () => {
          setIsSubmitting(false);
        },
      },
    });
  };

  return (
    <Main
      title="Settings"
      menu={
        <Sort 
          values={sortValues}
          activeValue={sort}
          onChange={(value) => setSort(value as NonNullable<typeof sort>)}
        />
      }
    >
      <section className="grid gap-8 border-t border-border p-4! first:border-t-0 md:p-8! lg:grid-cols-[25%_1fr] lg:gap-x-16 lg:gap-y-0">
        <header className="grid content-start gap-3 lg:col-span-1">
          <h2>Reset Password</h2>
        </header>

        <div className="grid gap-8 lg:col-start-2 lg:mb-8">
          <form onSubmit={onSubmit}>
            <div className="grid gap-8">
              <fieldset className="flex flex-col border-none gap-2">
                <legend className="relative mb-2 flex w-full items-center justify-between text-balance leading-snug font-bold [&_a]:font-normal">
                  <Label
                    htmlFor="current-password"
                    className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30"
                  >
                    Current password
                  </Label>
                </legend>
                <Input
                  required
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                />
              </fieldset>

              <fieldset className="flex flex-col border-none gap-2">
                <legend className="relative mb-2 flex w-full items-center justify-between text-balance leading-snug font-bold [&_a]:font-normal">
                  <Label
                    htmlFor="new-password"
                    className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30"
                  >
                    New password
                  </Label>
                </legend>
                <Input
                  required
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                />
              </fieldset>

              <Button className="bg-pink" variant="elevated" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save password"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </Main>
  );
};