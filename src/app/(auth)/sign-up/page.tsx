// "use client";

// import React from "react";
// import Link from "next/link";
// import { Metadata } from "next";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";

// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { GoogleAuthButton } from "@/components/GoogleOAuthButton";

// // ── 1) ZOD SCHEMA ────────────────────────────────────────────────
// const signUpSchema = z.object({
//   fullName: z.string().min(1, "Name is required"),
//   email:    z.string().min(1, "Email is required").email("Must be a valid email"),
//   password: z.string().min(8, "Password must be at least 8 characters"),
// });

// type SignUpData = z.infer<typeof signUpSchema>;

// // ── 2) PAGE & FORM ───────────────────────────────────────────────
// const SignUpPage = () => {
//   const form = useForm<SignUpData>({
//     resolver: zodResolver(signUpSchema),
//     defaultValues: {
//       fullName: "",
//       email: "",
//       password: "",
//     },
//   });

//   const onSubmit = (data: SignUpData) => {
//     console.log("Signing up with:", data);
//     // TODO: call your signup API
//   };

//   return (
//     <div className="max-w-lg p-7 mt-14 rounded-xl bg-[#0f0f0f] border border-[#1C1C1C]">
//       <h5 className="font-black text-xl text-white">Create an account</h5>
//       <div className="font-medium text-[#444444] text-[16px] leading-snug mt-1 mb-6">
//         Get funded faster with AI-powered grant writing made easy.
//       </div>

//       <Form {...form}>
//         <form
//           onSubmit={form.handleSubmit(onSubmit)}
//           className="space-y-3 mx-auto"
//         >
//           {/* Name */}
//           <FormField
//             control={form.control}
//             name="fullName"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Name</FormLabel>
//                 <FormControl>
//                   <Input
//                     placeholder="John Doe"
//                     {...field}
//                     value={field.value ?? ""}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Email */}
//           <FormField
//             control={form.control}
//             name="email"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Email</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="email"
//                     placeholder="you@example.com"
//                     {...field}
//                     value={field.value ?? ""}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           {/* Password */}
//           <FormField
//             control={form.control}
//             name="password"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Password</FormLabel>
//                 <FormControl>
//                   <Input
//                     type="password"
//                     placeholder="••••••••"
//                     {...field}
//                     value={field.value ?? ""}
//                   />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />

//           <Button type="submit" className="w-full h-10 font-bold text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 mt-2 cursor-pointer">
//             Sign Up
//           </Button>
//         </form>
//       </Form>

//       {/* OR continue with */}
//       <div className="my-10 w-full relative mx-auto">
//         <div className="bg-black rounded-md p-3 absolute text-themeTextGray text-xs font-medium top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//           OR CONTINUE WITH
//         </div>
//         <Separator orientation="horizontal" className="bg-[#1C1C1C]" />
//       </div>

//       <div className=" mx-auto">
//         <GoogleAuthButton method="signup" />
//       </div>

//       <div className="text-sm flex gap-1.5 items-center justify-center mt-5">
//         <span className="text-[#6D6D6D] font-medium">
//           Already have an account?
//         </span>
//         <Link
//           href="/login"
//           className="font-bold text-[#68FCF2] hover:text-[#68FCF2]/80"
//         >
//           Log In
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default SignUpPage;



// pages/SignUpPage.tsx
"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
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
import { Loader } from "@/components/Loader";
import { FormError } from "@/components/FormError";
import { FormSuccess } from "@/components/FormSuccess";
import { SignUpSchema } from "@/components/form/sign-up";
import { register } from "@/app/actions/register";
import { login } from "@/app/actions/login";
import { useSearchParams } from "next/navigation";



type SignUpData = z.infer<typeof SignUpSchema>;


const SignUpPage = () => {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/new-application";

  const form = useForm<SignUpData>({
    resolver: zodResolver(SignUpSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitted, errors },
    watch,
    reset,
    control,
  } = form;

  const onSubmit = (values: any) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const data = await register(values);

      if (data.error) {
        setError(data.error);
        reset();
      } else if (data.success) {
        setSuccess(data.success);

        // Optionally auto-login the user after registration
        const res = await login(values, callbackUrl);

        if (res?.error) {
          setError("Registration successful, but failed to log in");
        } else {
          console.error("Login Error:", res.error);
        }
      }
    });
  };

  const emailValue = watch("email");

  return (
    <div className="max-w-lg p-7 mt-14 rounded-xl bg-[#0f0f0f] border border-[#1C1C1C]">
      <h5 className="font-black text-xl text-white">Create an account</h5>
      <div className="font-medium text-[#444444] text-[16px] leading-snug mt-1 mb-6">
        Get funded faster with AI-powered grant writing made easy.
      </div>

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 mt-6"
        >
          {/* Name */}
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage>{errors.name?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Email */}
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

          {/* Password */}
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

          {/* FormError / FormSuccess */}
          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}

          {/* Submit Button with Loader */}
          <Button
            type="submit"
            className="w-full h-10 font-bold text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 mt-2 rounded-md cursor-pointer"
            disabled={isPending}
          >
            <Loader loading={isPending}>Sign Up</Loader>
          </Button>
        </form>
      </Form>

      {/* OR continue with */}
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
        <span className="text-[#6D6D6D] font-medium">Already have an account?</span>
        <Link
          href="/login"
          className="font-bold text-[#68FCF2] hover:text-[#68FCF2]/80"
        >
          Log In
        </Link>
      </div>
    </div>
  );
};

export default SignUpPage;
