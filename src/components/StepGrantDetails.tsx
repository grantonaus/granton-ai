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


const grantDetailsSchema = z
  .object({
    grantLink: z.string().url("Must be a valid URL"),
    amountApplyingFor: z.string().min(1, "Required"),

    // Either a File (PDF) or nothing
    guidelinesFile: z
      .instanceof(File)
      .refine((f) => f.type === "application/pdf", "Only PDF allowed")
      .optional(),

    // Either a valid URL or ""
    guidelinesLink: z
      .union([z.string().url("Must be a valid URL"), z.literal("")])
      .optional(),

    applicationFormFile: z
      .instanceof(File)
      .refine((f) => f.type === "application/pdf", "Only PDF allowed")
      .optional(),

    applicationFormLink: z
      .union([z.string().url("Must be a valid URL"), z.literal("")])
      .optional(),
  })
  // Must provide either a PDF **or** a link for Guidelines
  .refine(
    (data) => data.guidelinesFile instanceof File || !!data.guidelinesLink,
    {
      message: "You must provide either a file or a link for Guidelines",
      path: ["guidelinesFile"],
    }
  )
  // Must provide either a PDF **or** a link for Application Form
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
}

export default function StepGrantDetails({
  defaultValues,
  onNext,
  onBack,
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
    // await the parent callback (which is async)
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
            {/* Grant Link & Amount */}
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

            {/* Upload Grant Guidelines PDF */}
            <FormField
              control={form.control}
              name="guidelinesFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grant Application Guidelines Document</FormLabel>
                  <FormControl>
                    {/* <FileUploader
                      value={guidelinesFile ? [guidelinesFile] : []}
                      onValueChange={(newFiles) => {
                        if (!newFiles || newFiles.length === 0) {
                          setGuidelinesFile(null);
                          form.setValue("guidelinesFile", undefined);
                          return;
                        }
                        const file = newFiles[0];
                        if (file.type !== "application/pdf") {
                          // If you want, replace this with toast.error("Only PDF allowed")
                          console.error("Only PDF files are allowed for guidelines");
                          return;
                        }
                        setGuidelinesFile(file);
                        form.setValue("guidelinesFile", file);
                      }}
                      dropzoneOptions={dropZoneConfig}
                      className="relative bg-background rounded-md p-0.5"
                    >
                      <FileInput
                        id="fileInput"
                        className="outline-dashed outline-1 outline-border"
                      >
                        <div className="flex items-center justify-center flex-col p-8 w-full ">
                          <div className="flex items-center justify-center rounded-md size-[34px] bg-[#141414] mb-2">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12.75 21C12.75 21.4142 12.4142 21.75 12 21.75C11.5858 21.75 11.25 21.4142 11.25 21V18.2119L12.75 18.21V21ZM11.4443 6C13.835 6 15.905 7.3728 16.9092 9.37305C16.9111 9.3769 16.9157 9.37952 16.9199 9.37891C19.5452 9.00301 21.9997 11.1047 22 13.7773C22 16.0819 20.2459 17.9772 18 18.2002L12.75 18.21V14.8105L13.9697 16.0303L14.0264 16.082C14.3209 16.3223 14.7557 16.3048 15.0303 16.0303C15.3049 15.7557 15.3223 15.3209 15.082 15.0264L15.0303 14.9697L12.8838 12.8232L12.7891 12.7373C12.3308 12.3635 11.6692 12.3635 11.2109 12.7373L11.1162 12.8232L8.96973 14.9697C8.67688 15.2626 8.67685 15.7374 8.96973 16.0303C9.26261 16.3231 9.73739 16.3231 10.0303 16.0303L11.25 14.8105V18.2119L6 18.2227H5.33301C3.49221 18.2225 2 16.7295 2 14.8887C2.00012 13.0606 3.52692 11.5543 5.34863 11.5557C5.3537 11.5557 5.35874 11.5519 5.35938 11.5469C5.64432 8.43653 8.25968 6.00006 11.4443 6Z" fill="#6D6D6D" />
                            </svg>
                          </div>

                          <p className="mb-0.5 text-[15px] font-semibold text-white">
                            Upload file
                          </p>
                          <p className="text-sm text-gray-500 dark:text-[#595959]">
                            Drag and drop your file here, or click to upload
                          </p>
                        </div>
                      </FileInput>
                      <FileUploaderContent>
                        {guidelinesFile && (
                          <FileUploaderItem index={0}>
                            <Paperclip className="h-4 w-4 stroke-current" />
                            <span>{guidelinesFile.name}</span>
                          </FileUploaderItem>
                        )}
                      </FileUploaderContent>
                    </FileUploader> */}



                    <FileUpload
                      acceptedTypes=".pdf"
                      maxFiles={1}
                      onFileChange={(files: File[]) => {
                        // FileUpload always returns an array of at most one valid PDF
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

            {/* Grant Guidelines Link */}
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

            {/* Upload Application Form PDF */}
            <FormField
              control={form.control}
              name="applicationFormFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grant Application Form Document</FormLabel>
                  <FormControl>
                    {/* <FileUploader
                      value={applicationFormFile ? [applicationFormFile] : []}
                      onValueChange={(newFiles) => {
                        if (!newFiles || newFiles.length === 0) {
                          setApplicationFormFile(null);
                          form.setValue("applicationFormFile", undefined);
                          return;
                        }
                        const file = newFiles[0];
                        if (file.type !== "application/pdf") {
                          console.error("Only PDF files are allowed for application form");
                          return;
                        }
                        setApplicationFormFile(file);
                        form.setValue("applicationFormFile", file);
                      }}
                      dropzoneOptions={dropZoneConfig}
                      className="relative bg-background rounded-md p-0.5"
                    >
                      <FileInput id="applicationFormUploader" className="outline-dashed outline-1 outline-border">
                        <div className="flex items-center justify-center flex-col p-8 w-full ">
                          <div className="flex items-center justify-center rounded-md size-[34px] bg-[#141414] mb-2">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12.75 21C12.75 21.4142 12.4142 21.75 12 21.75C11.5858 21.75 11.25 21.4142 11.25 21V18.2119L12.75 18.21V21ZM11.4443 6C13.835 6 15.905 7.3728 16.9092 9.37305C16.9111 9.3769 16.9157 9.37952 16.9199 9.37891C19.5452 9.00301 21.9997 11.1047 22 13.7773C22 16.0819 20.2459 17.9772 18 18.2002L12.75 18.21V14.8105L13.9697 16.0303L14.0264 16.082C14.3209 16.3223 14.7557 16.3048 15.0303 16.0303C15.3049 15.7557 15.3223 15.3209 15.082 15.0264L15.0303 14.9697L12.8838 12.8232L12.7891 12.7373C12.3308 12.3635 11.6692 12.3635 11.2109 12.7373L11.1162 12.8232L8.96973 14.9697C8.67688 15.2626 8.67685 15.7374 8.96973 16.0303C9.26261 16.3231 9.73739 16.3231 10.0303 16.0303L11.25 14.8105V18.2119L6 18.2227H5.33301C3.49221 18.2225 2 16.7295 2 14.8887C2.00012 13.0606 3.52692 11.5543 5.34863 11.5557C5.3537 11.5557 5.35874 11.5519 5.35938 11.5469C5.64432 8.43653 8.25968 6.00006 11.4443 6Z" fill="#6D6D6D" />
                            </svg>
                          </div>

                          <p className="mb-0.5 text-[15px] font-semibold text-white">
                            Upload file
                          </p>
                          <p className="text-sm text-gray-500 dark:text-[#595959]">
                            Drag and drop your file here, or click to upload
                          </p>
                        </div>
                      </FileInput>
                      <FileUploaderContent>
                        {applicationFormFile && (
                          <FileUploaderItem index={0}>
                            <Paperclip className="h-4 w-4 stroke-current" />
                            <span>{applicationFormFile.name}</span>
                          </FileUploaderItem>
                        )}
                      </FileUploaderContent>
                    </FileUploader> */}

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

      {/* ─── Fixed footer at bottom: “Back” & “Continue” ─── */}
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
            disabled={isLoading}
          >
            <Loader loading={isLoading}>Continue</Loader>
          </Button>
        </div>
      </div>



    </div >
  );
}


