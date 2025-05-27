
import React from 'react';
import Link from "next/link"
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sign Up",
};

const SignUpPage = () => {
  return (
    <>
      <h5 className="font-bold text-xl text-primary">Create an account</h5>
      <div className="text-gray-500 leading-snug mt-1">
      Join us today! Create your account to get started in just a few simple steps.
      </div>
      {/* <SignUpForm /> */}
      <div className="my-10 w-full relative">
        <div className="bg-gray-50 dark:bg-black rounded-md p-3 absolute text-themeTextGray text-xs top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          OR CONTINUE WITH
        </div>
        {/* <Separator orientation="horizontal" className="bg-themeGray" /> */}
      </div>
      {/* <GoogleAuthButton method="signup" /> */}

      <div className="text-sm flex flex-row gap-2 items-center justify-center mt-5">
        <div className="text-gray-500">Already have an account?</div>
        <Link href="/sign-in" className="text-[#6127FF] hover:text-[#6127FF]/80">Sign In</Link>
    </div>
    </>
  )
}

export default SignUpPage