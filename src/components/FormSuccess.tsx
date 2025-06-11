

import { Check } from "lucide-react";

interface FormSuccessProps {
  message?: string;
};

export const FormSuccess = ({
  message,
}: FormSuccessProps) => {
  if (!message) return null;

  return (
    <div className="w-full bg-green-500/10 p-3 rounded-md flex items-center gap-x-2 text-sm text-green-500">
      <Check className="h-4 w-4 text-green-500"/>
      
      <p>{message}</p>
    </div>
  );
};