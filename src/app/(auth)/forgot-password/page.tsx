"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";

import { Loader } from "@/components/Loader";
import { FormError } from "@/components/FormError";
import { FormSuccess } from "@/components/FormSuccess";

import { PasswordResetSchema } from "@/components/form/password-reset";
import { reset } from "@/app/actions/reset";

type PasswordResetFormValues = z.infer<typeof PasswordResetSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: { email: "" },
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitted },
    reset: formReset,
    control,
  } = form;

  const onSubmit = (values: PasswordResetFormValues) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await reset(values);
        if (result?.error) {
          setError(result.error);
          formReset();
        } else {
          setSuccess("Password reset email sent successfully!");
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
      <h5 className="font-black text-xl text-white">Forgot Password</h5>
      <div className="font-medium text-[#444444] text-[16px] leading-snug mt-1 mb-6">
        Enter your email and we’ll send you a link to reset your password.
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
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

          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}

          <Button
            type="submit"
            className="w-full h-10 font-bold text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 mt-2 rounded-md"
            disabled={isPending}
          >
            <Loader loading={isPending}>Send Reset Link</Loader>
          </Button>
        </form>
      </Form>

      <div className="text-sm flex gap-1.5 items-center justify-center mt-5">
        <span className="text-[#6D6D6D] font-medium">Remembered your password?</span>
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
