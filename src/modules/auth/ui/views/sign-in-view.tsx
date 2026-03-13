"use client";

import { useState } from "react";
import { useMutation } from "convex/react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { api } from "../../../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
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
        <fieldset className="flex flex-col border-none gap-2"> 
          <legend className="relative mb-2 flex w-full items-center justify-between text-balance leading-snug font-bold [&_a]:font-normal">
            <Label 
              htmlFor="username"
              className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30"
            >
              Employee ID
            </Label>
          </legend>
          <Input 
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full"
          />
        </fieldset>

        <fieldset className="flex flex-col border-none gap-2"> 
          <legend className="relative mb-2 flex w-full items-center justify-between text-balance leading-snug font-bold [&_a]:font-normal">
            <Label 
              htmlFor="password"
              className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30"
            >
              Last 5 digits of your citizenship number
            </Label>
          </legend>
          <Input 
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
        </fieldset>

        <Button variant="elevated">
          Login
        </Button>
      </div>
    </form>
  );
}