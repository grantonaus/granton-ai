"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GoogleAuthButton } from "@/components/GoogleOAuthButton";
import { FormError } from "@/components/FormError";
import { FormSuccess } from "@/components/FormSuccess";
import { Loader } from "@/components/Loader";
import { SignInSchema } from "@/components/form/login";
import { login } from "@/app/actions/login";
import { useRouter } from "next/navigation";


type LoginData = z.infer<typeof SignInSchema>;


const LoginPage = () => {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const form = useForm<LoginData>({
    resolver: zodResolver(SignInSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { handleSubmit, formState: { isSubmitted, errors }, watch, reset, control } = form;
  const onSubmit = (values: any) => {
    setError("");
    setSuccess("");
    console.log("Starting login process with values:", values); 

    startTransition(async () => {
      try {
        const result = await login(values);
        console.log("Login result:", result); 

        router.push("/new-application")

        if (result?.error) {
          console.error("Login Error:", result.error);
          setError(result.error);
          reset();
        } else {
          // Login successful
          setSuccess("Login successful!");
          console.log("Login successful.");

        }
      } catch (err) {
        console.error("Unexpected Error:", err);
        setError("Something went wrong! Please try again.");
        reset();
      }
    });
  };

  const emailValue = watch("email");

  return (
    <div className="max-w-lg p-7 mt-14 rounded-xl bg-[#0f0f0f] border border-[#1C1C1C]">
      <h5 className="font-black text-xl text-white">Welcome back</h5>
      <div className="font-medium text-[#444444] text-[16px] leading-snug mt-1 mb-6">
        Log in to continue and get matched with grants faster.
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 mt-6">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage>{errors.email?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage>{errors.password?.message}</FormMessage>
              </FormItem>
            )}
          />

          <Link
            href={{
              pathname: "/forgot-password",
              query: { email: emailValue },
            }}
            className="text-sm font-medium underline text-[#68FCF2] hover:text-[#68FCF2]/80"
          >
            Forgot password?
          </Link>

          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}

          <Button
            type="submit"
            className="w-full h-10 font-bold text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 mt-2 rounded-md cursor-pointer"
            disabled={isPending}
          >
            <Loader loading={isPending}>Log In</Loader>
          </Button>
        </form>
      </Form>

      <div className="my-10 w-full relative mx-auto">
        <div className="bg-black rounded-md p-3 absolute text-themeTextGray text-xs font-medium top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          OR CONTINUE WITH
        </div>
        <Separator orientation="horizontal" className="bg-[#1C1C1C]" />
      </div>

      <div className="mx-auto">
        <GoogleAuthButton method="signup" />
      </div>

      <div className="text-sm flex gap-1.5 items-center justify-center mt-5">
        <span className="text-[#6D6D6D] font-medium">
          Don’t have an account?
        </span>
        <Link
          href="/sign-up"
          className="font-bold text-[#68FCF2] hover:text-[#68FCF2]/80"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
