"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { Loader } from "@/components/Loader";
import { FormError } from "@/components/FormError";
import { FormSuccess } from "@/components/FormSuccess";
import { newPassword } from "@/app/actions/new-password"; 

import { NewPasswordSchema } from "@/components/form/new-password";

type NewPasswordFormValues = z.infer<typeof NewPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? ""; 

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isTransitioning, startTransition] = useTransition();

  const form = useForm<NewPasswordFormValues>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  const {
    handleSubmit,
    formState: { errors },
    control,
    reset: formReset,
  } = form;

  const onSubmit = (values: NewPasswordFormValues) => {
    setError("");
    setSuccess("");

    if (!token) {
      setError("Token is missing or invalid!");
      return;
    }

    startTransition(async () => {
      try {
        // Call server action
        const result = await newPassword(values, token);

        if (result?.error) {
          setError(result.error);
          formReset();
        } else {
          setSuccess(result.success || "Password updated successfully!");

          setTimeout(() => {
            router.push("/login");
          }, 1000);

          formReset();
        }
      } catch (err) {
        console.error("Unexpected Error:", err);
        setError("Something went wrong! Please try again.");
        formReset();
      }
    });
  };

  return (
    <div className="max-w-lg p-7 mt-14 mx-auto rounded-xl bg-[#0f0f0f] border border-[#1C1C1C]">
      <h5 className="font-black text-xl text-white">Reset Password</h5>
      <div className="font-medium text-[#444444] text-[16px] leading-snug mt-1 mb-6">
        Choose a new password for your account.
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage>{errors.newPassword?.message}</FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="confirmNewPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage>
                  {errors.confirmNewPassword?.message}
                </FormMessage>
              </FormItem>
            )}
          />

          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}

          <Button
            type="submit"
            className="w-full h-10 font-bold text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 mt-2 rounded-md"
            disabled={isTransitioning}
          >
            <Loader loading={isTransitioning}>Reset Password</Loader>
          </Button>
        </form>
      </Form>

      <div className="text-sm flex gap-1.5 items-center justify-center mt-5">
        <span className="text-[#6D6D6D] font-medium">
          Remembered your password?
        </span>
        <Link
          href="/login"
          className="font-bold text-[#68FCF2] hover:text-[#68FCF2]/80"
        >
          Log In
        </Link>
      </div>
    </div>
  );
}
