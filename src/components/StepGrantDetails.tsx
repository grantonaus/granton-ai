"use client"


import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FileUploader, FileInput, FileUploaderContent, FileUploaderItem } from "@/components/ui/file-upload"

import FileUpload from "./FileUpload"
import { Loader } from "./Loader"
import { URL } from "url"


const grantDetailsSchema = z
  .object({
    // grantLink: z.string().refine((val) => {
    //   try {
    //     new URL(val);
    //     return true;
    //   } catch {
    //     return false;
    //   }
    // }, {
    //   message: "Must be a valid website URL",
    // }), 
    grantLink: z.string().min(2, "Must be a valid URL"),
    amountApplyingFor: z.string().min(1, "Required"),
    guidelinesFile: z
      .instanceof(File)
      .refine((f) => f.type === "application/pdf", "Only PDF allowed")
      .optional(),
    guidelinesLink: z
      // .union([z.string().min(2, "Must be a valid URL"), z.literal("")])
      .union([z.string().url("Must be a valid URL"), z.literal("")])
      .optional(),
    applicationFormFile: z
      .instanceof(File)
      .refine((f) => f.type === "application/pdf", "Only PDF allowed")
      .optional(),
    applicationFormLink: z
      // .union([z.string().min(2, "Must be a valid URL"), z.literal("")])
      .union([z.string().url("Must be a valid URL"), z.literal("")])
      .optional(),
  })
  .refine(
    (data) => data.guidelinesFile instanceof File || !!data.guidelinesLink,
    {
      message: "You must provide either a file or a link for Guidelines",
      path: ["guidelinesFile"],
    }
  )
  .refine(
    (data) =>
      data.applicationFormFile instanceof File || !!data.applicationFormLink,
    {
      message:
        "You must provide either a file or a link for Application Form",
      path: ["applicationFormFile"],
    }
  );


const blankGrant: GrantDetailsData = {
  grantLink: "",
  amountApplyingFor: "",
  guidelinesFile: undefined,
  guidelinesLink: "",
  applicationFormFile: undefined,
  applicationFormLink: "",
};

export type GrantDetailsData = z.infer<typeof grantDetailsSchema>

interface StepGrantDetailsProps {
  defaultValues?: Partial<GrantDetailsData>
  onNext: (values: GrantDetailsData) => void
  onBack: () => void
  isProfileComplete: boolean
}

export default function StepGrantDetails({
  defaultValues,
  onNext,
  onBack,
  isProfileComplete,
}: StepGrantDetailsProps) {
  const [isLoading, setIsLoading] = useState(false)


  const [guidelinesFile, setGuidelinesFile] = useState<File | null>(
    defaultValues?.guidelinesFile ?? null
  );
  const [applicationFormFile, setApplicationFormFile] = useState<File | null>(
    defaultValues?.applicationFormFile ?? null
  );


  const form = useForm<GrantDetailsData>({
    resolver: zodResolver(grantDetailsSchema),
    defaultValues: defaultValues ?? blankGrant,
  })

  useEffect(() => {
    if (!defaultValues) return;
  
    form.reset({
      grantLink: defaultValues.grantLink ?? "",
      amountApplyingFor: defaultValues.amountApplyingFor ?? "",
      guidelinesFile: defaultValues.guidelinesFile ?? undefined,
      guidelinesLink: defaultValues.guidelinesLink ?? "",
      applicationFormFile: defaultValues.applicationFormFile ?? undefined,
      applicationFormLink: defaultValues.applicationFormLink ?? "",
    });
  
    setGuidelinesFile(defaultValues.guidelinesFile ?? null);
    setApplicationFormFile(defaultValues.applicationFormFile ?? null);
  }, [defaultValues, form]);


  const handleSubmit = async (data: GrantDetailsData) => {
    setIsLoading(true)
    await onNext({
      ...data,
      guidelinesFile: guidelinesFile ?? undefined,
      applicationFormFile: applicationFormFile ?? undefined,
    })
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto pt-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-[960px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="grantLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grant Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://grant.org/apply" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="amountApplyingFor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Applying For</FormLabel>
                      <FormControl>
                        <Input placeholder="$0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="guidelinesFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grant Application Guidelines Document</FormLabel>
                  <FormControl>
                    <FileUpload
                      acceptedTypes=".pdf"
                      maxFiles={1}
                      onFileChange={(files: File[]) => {
                        if (files.length === 0) {
                          setGuidelinesFile(null);
                          form.setValue("guidelinesFile", undefined);
                        } else {
                          const file = files[0];
                          setGuidelinesFile(file);
                          form.setValue("guidelinesFile", file);
                        }
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guidelinesLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grant Guidelines Form Document (if attachment not available)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.grant-guidelines.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicationFormFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grant Application Form Document</FormLabel>
                  <FormControl>
                    <FileUpload
                      acceptedTypes=".pdf"
                      maxFiles={1}
                      onFileChange={(files: File[]) => {
                        if (files.length === 0) {
                          setApplicationFormFile(null);
                          form.setValue("applicationFormFile", undefined);
                        } else {
                          const file = files[0];
                          setApplicationFormFile(file);
                          form.setValue("applicationFormFile", file);
                        }
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />



            <FormField
              control={form.control}
              name="applicationFormLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grant Application Form Document (if attachment not available)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://apply-here.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="h-2" />
          </form>
        </Form>
      </div>

      <div className="bg-[#0F0F0F]/80 backdrop-blur-xs pt-4 pb-6 md:pb-8">
        <div className="max-w-[960px] mx-auto flex justify-between gap-4">
          <Button
            variant="outline"
            className="flex-1 h-10 font-black text-white bg-[#0E0E0E] hover:bg-[#101010] border border-[#1C1C1C] hover:text-white cursor-pointer"
            onClick={onBack}
            type="button"
          >
            Back
          </Button>
          <Button
            type="submit"          
            className="flex-1 h-10 font-black text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 cursor-pointer"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isLoading || !isProfileComplete∆}
          >
            <Loader loading={isLoading}>Continue</Loader>
          </Button>
        </div>
      </div>
    </div >
  );
}


