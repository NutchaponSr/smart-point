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
      <div className="flex flex-col text-base relative text-start w-full">
        <fieldset className="flex min-w-0 flex-col gap-1 border-none"> 
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
            className="caret-[#49c0f8] placeholder:text-[#f1f7fb] min-w-0 text-white bg-[#202f36] border-2 border-[#37464f] flex rounded-md overflow-hidden"
          />
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-1 border-none"> 
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
            className="caret-[#49c0f8] placeholder:text-[#f1f7fb] min-w-0 text-white bg-[#202f36] border-2 border-[#37464f] flex rounded-md overflow-hidden"
          />
          <span className="text-[#52656d]">5 ตัวท้ายของหมายเลขประจำตัวประชาชน</span>
        </fieldset>

        <Button variant="secondary" type="submit" className="mt-4">
          เข้าสู่ระบบ
        </Button>
      </div>
    </form>
  );
}