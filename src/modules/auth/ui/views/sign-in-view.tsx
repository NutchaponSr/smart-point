"use client";

import { useState } from "react";

import { authClient } from "@/lib/convex/auth-client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";

export const SignInView = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    await authClient.signIn.username({
      username: username,
      password: password,
    }, {
      onSuccess: (data) => {
        router.push("/");
      },
      onError: (error) => {
        console.error(error);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-8">
        <fieldset className="flex min-w-0 flex-col gap-2 border-none"> 
          <legend className="relative mb-2 flex w-full min-w-0 items-center justify-between text-balance leading-snug font-bold [&_a]:font-normal">
            <Label 
              htmlFor="username"
              className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 sr-only"
            >
              Employee ID
            </Label>
          </legend>
          <Input 
            required
            id="username"
            type="text"
            value={username}
            placeholder="รหัสพนักงาน"
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg bg-brand-sky/60 px-6 py-4 text-lg font-medium text-brand-navy placeholder:text-brand-navy/70 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-2 border-none"> 
          <legend className="relative mb-2 flex w-full min-w-0 items-center justify-between text-balance leading-snug font-bold [&_a]:font-normal">
            <Label 
              htmlFor="password"
              className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 sr-only"
            >
              Last 5 digits of your citizenship number
            </Label>
          </legend>
          <Input 
            required
            id="password"
            type="password"
            value={password}
            placeholder="รหัสผ่าน"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-brand-sky/60 px-6 py-4 text-lg font-medium text-brand-navy placeholder:text-brand-navy/70 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </fieldset>

        <Button variant="elevated" type="submit" className="bg-pink">
          Login
        </Button>
      </div>
    </form>
  );
}