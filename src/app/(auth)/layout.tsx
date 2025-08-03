import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign Up",
};

interface AuthLayoutProps {
  children: ReactNode;
}

const useGridLayout = true;

const AuthLayout = async ({ children }: AuthLayoutProps) => {

  if (useGridLayout) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-1">
        <div className="flex justify-center items-center bg-background p-1 md:p-6">
          <div className="w-full max-w-lg">
            <Image
              className="text-xl font-bold absolute left-5 top-5 md:left-8 md:top-8"
              src="/1.png"
              alt='logo'
              width={130} 
              height={64}
            />
            {children}
          </div>
        </div>


      </div>
    );
  }

};

export default AuthLayout;
