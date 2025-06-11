
"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader } from "./Loader";

const budgetSchema = z.object({
  allocationDetails: z.string().min(1, "Allocation details are required"),
});
export type BudgetDetailsData = z.infer<typeof budgetSchema>;

const blankBudget: BudgetDetailsData = {
  allocationDetails: "",
};
const defaultGrantRequirements = `
Eligible Expenses include:
Consultants
Staff
Travel & Conferences
Marketing Costs

Co-Contribution Required of 20%
`.trim();

interface BudgetDetailsDetailsProps {
  defaultValues?: Partial<BudgetDetailsData>;
  onBack: () => void;
  onNext: (data: BudgetDetailsData) => void;
  grantValues: any,
  grantRequirements?: string;
}

export default function BudgetDetailsDetails({
  defaultValues,
  onBack,
  onNext,
  grantValues,
  grantRequirements = "",
}: BudgetDetailsDetailsProps) {
  const form = useForm<BudgetDetailsData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: defaultValues ?? blankBudget,
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: BudgetDetailsData) => {
    setIsLoading(true);
    await onNext(values);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pt-4 pb-8">
        <Form {...form}>

          <form
            id="stepForm"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-w-[960px] mx-auto"
          >
            <div className="flex">
              <div className="w-auto font-semibold p-3 rounded-md text-[15px] bg-[#191C19] text-[#68FC92]">
                Amount Applying For: ${grantValues?.amountApplyingFor}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4">
              <div className="col-span-1 md:col-span-6">
                <FormField
                  control={form.control}
                  name="allocationDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Allocate all funds as per Grant Requirements
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Break down how you plan to spend the grant funds. Include major cost areas (e.g. salaries, consultants, marketing) and any matched funding contributions."
                          {...field}
                          value={field.value ?? ""}
                          className="h-60 resize-none bg-[#121212] border border-[#252525] text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Grant Requirements (right column) */}
              <div className="col-span-1 md:col-span-6">
                <FormItem>
                  <FormLabel>Grant Requirements (Auto-Generated)</FormLabel>
                  <FormControl>
                    <div
                      className="
                        h-60 w-full
                        bg-[#181818] font-semibold border border-[#292929]
                        p-4 overflow-y-auto
                        text-[#6b6b6b] text-sm
                        select-none
                        whitespace-pre-wrap
                        rounded-md
                      "
                    >

                      {grantRequirements || (
                        <span className="text-[#444444] italic">
                          (No requirements found. The AI response will appear here.)
                        </span>
                      )}
                    </div>
                  </FormControl>
                </FormItem>
              </div>
            </div>
          </form>
        </Form>
      </div>

      <div className="bg-[#0F0F0F]/80 backdrop-blur-xs pt-4 pb-6 md:pb-8">
        <div className="max-w-[960px] mx-auto flex justify-between gap-4">
          <Button
            variant="outline"
            className="flex-1 h-10 font-black text-white bg-[#0E0E0E] hover:bg-[#101010] border border-[#1C1C1C] hover:text-white cursor-pointer"
            onClick={onBack}
          >
            Back
          </Button>

          <Button
            type="submit"
            form="stepForm"
            className="flex-1 h-10 font-black text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 cursor-pointer"
            disabled={isLoading}
          >
            <Loader loading={isLoading}>Continue</Loader>
          </Button>
        </div>
      </div>
    </div>
  );
}

