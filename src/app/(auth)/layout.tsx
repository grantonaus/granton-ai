import { ReactNode } from "react";
// import { onAuthenticatedUser } from "../actions/auth";
import { redirect } from "next/navigation"
// import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign Up",
};

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = async({ children}: AuthLayoutProps) => {
//   const user = await onAuthenticatedUser();

//   if (user.status === 200) redirect("/callback/sign-in")

    return (
        <div className="w-full h-screen flex justify-center items-center">
            <div className="flex flex-col w-full items-center py-24">
            <div className="flex flex-row items-center space-x-2">
            {/* <div className="rounded-sm bg-[#6127FF] flex items-center justify-center size-8 mr-1">
              <div className="size-5 rounded-full bg-white dark:bg-black"/>
            </div> */}
            <Image
              src="/logo.png"
              alt='logo'
              width={36}
              height={36}
            />
              <div className="text-3xl font-bold text-primary">Granton AI</div>
            </div>
                {/* <Card className="xs:w-full md:w-7/12 lg:w-5/12 xl:w-4/12 p-7 mt-6">
                {children}
                </Card> */}
            </div>
        </div>
    )
}

export default AuthLayout;