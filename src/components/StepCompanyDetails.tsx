
"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import { Paperclip } from "lucide-react";
import FileUpload from "./FileUpload";

const PdfFile = z.custom<File>(
  (f) => f instanceof File && f.type === "application/pdf",
  { message: "Only PDF files are allowed" }
);

const ExistingAttachment = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  key: z.string().min(1),
});

// 3) Now allow either a real File OR an existing‐attachment object:
const Attachment = z.union([PdfFile, ExistingAttachment]);

// ─── 1) Zod schema with PDF-only attachment validation ───────────────────────
const companySchema = z.object({
  website_url: z.string().url("Must be a valid URL"),
  company_name: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  company_background: z.string().min(1, "Required"),
  product: z.string().min(1, "Required"),
  competitors_unique_value_proposition: z.string().min(1, "Required"),
  current_stage: z.string().min(1, "Required"),
  main_objective: z.string().min(1, "Required"),
  target_customers: z.string().min(1, "Required"),
  funding_status: z.string().min(1, "Required"),
  // attachments: z
  //   .array(
  //     z.custom<File>((file) => file.type === "application/pdf", {
  //       message: "Only PDF files are allowed",
  //     })
  //   )
  //   .max(3, "You can upload up to 3 files")
  //   .optional(),
  attachments: z
    .array(Attachment)
    .max(3, "You can have at most 3 attachments")
    .optional(),
});

export type CompanyDetailsData = z.infer<typeof companySchema>;

// blank defaults so inputs never undefined
const blankCompany: CompanyDetailsData = {
  website_url: "",
  company_name: "",
  country: "",
  company_background: "",
  product: "",
  competitors_unique_value_proposition: "",
  current_stage: "",
  main_objective: "",
  target_customers: "",
  funding_status: "",
  attachments: [],
};

interface StepCompanyDetailsProps {
  onNext: (data: CompanyDetailsData) => void;
  defaultValues?: Partial<CompanyDetailsData>;
}

export default function StepCompanyDetails({
  onNext,
  defaultValues,
}: StepCompanyDetailsProps) {
  // const [files, setFiles] = useState<File[]>(defaultValues?.attachments || []);

  const [existingFiles, setExistingFiles] = useState<
    { name: string; url: string; key: string }[]
  >(defaultValues?.attachments as any[] || []);

  const [newFiles, setNewFiles] = useState<File[]>([]);

  const handleFileChange = (newFiles: File[]) => {
    const pdfFiles = newFiles.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length > 3) {
      toast.error("You can upload up to 3 PDF files only.");
      pdfFiles.splice(3); // keep only first 3
    }
    setNewFiles(pdfFiles);
    form.setValue("attachments", pdfFiles);
  };


  const form = useForm<CompanyDetailsData>({
    resolver: zodResolver(companySchema),
    defaultValues: defaultValues ?? blankCompany,
  });

  function onSubmit(values: CompanyDetailsData) {
    try {
      onNext(values);
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    }
  }

  return (



    <div className="flex flex-col h-full">
      {/* ─── Scrollable form region: fill remaining space and allow vertical scroll only when needed ─── */}


      <div className="flex-1 min-h-0 overflow-y-auto pt-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-[960px] mx-auto">
            {/* Grant Link & Amount */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
              <div className="col-span-1 xl:col-span-4">
                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.yourcompany.com"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1 xl:col-span-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="FutureTech Pty Ltd"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1 xl:col-span-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Australia"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 2) Company Background */}
            <FormField
              control={form.control}
              name="company_background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Background</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does your company/project do? Give an overview of your products / services. What problems are you trying to solve?"
                      className="h-24 resize-none text-white"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3) Product or Service */}
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product or Service Seeking Funding</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain what the product/service is, how it works, and what makes it unique."
                      className="h-24 resize-none text-white"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4) Main Objective (Select) */}
            <FormField
              control={form.control}
              name="main_objective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    What is your main objective with this project related to funding?
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select objective" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="raise_capital">Raise Capital</SelectItem>
                      <SelectItem value="reach_new_customers">
                        Reach New Customers
                      </SelectItem>
                      <SelectItem value="raise_funding_for_development">
                        Raise Funding for Development
                      </SelectItem>
                      <SelectItem value="employ_staff">Employ Staff</SelectItem>
                      <SelectItem value="commercialise">Commercialise</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5) Competitors / UVP */}
            <FormField
              control={form.control}
              name="competitors_unique_value_proposition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competitors / Unique Value Proposition</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does your company/project do? Give an overview of your products / services. What problems are you trying to solve?"
                      className="h-24 resize-none text-white"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6) Target Customers */}
            <FormField
              control={form.control}
              name="target_customers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Customers</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your ideal customer or user."
                      className="h-24 resize-none text-white"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 7) Current Stage (Select) */}
            <FormField
              control={form.control}
              name="current_stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Stage of Product / Solution</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="prototype_developed">
                        Prototype developed
                      </SelectItem>
                      <SelectItem value="tested_with_users">
                        Tested with users
                      </SelectItem>
                      <SelectItem value="traction_with_paid_users">
                        Traction with paid users
                      </SelectItem>
                      <SelectItem value="scaling">Scaling</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 8) Funding Status */}
            <FormField
              control={form.control}
              name="funding_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Status</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Have you received any previous grants or external investment? If yes, describe."
                      className="h-24 resize-none text-white"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 9) Attachments (up to 3 PDFs) */}
            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachments (Optional)</FormLabel>
                  <FormControl>
                    {/* <FileUploader
                      value={files}
                      onValueChange={handleFileChange}
                      dropzoneOptions={dropZoneConfig}
                      className="relative bg-background rounded-md p-0.5"
                    >
                      <FileInput id="fileInput" className="outline-dashed outline-1 outline-border">
                        <div className="flex items-center justify-center flex-col p-8 w-full">
                          <div className="flex items-center justify-center rounded-md h-8 w-8 bg-[#141414] mb-2">
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12.75 21C12.75 21.4142 12.4142 21.75 12 21.75C11.5858 21.75 11.25 21.4142 11.25 21V18.2119L12.75 18.21V21ZM11.4443 6C13.835 6 15.905 7.3728 16.9092 9.37305C16.9111 9.3769 16.9157 9.37952 16.9199 9.37891C19.5452 9.00301 21.9997 11.1047 22 13.7773C22 16.0819 20.2459 17.9772 18 18.2002L12.75 18.21V14.8105L13.9697 16.0303L14.0264 16.082C14.3209 16.3223 14.7557 16.3048 15.0303 16.0303C15.3049 15.7557 15.3223 15.3209 15.082 15.0264L15.0303 14.9697L12.8838 12.8232L12.7891 12.7373C12.3308 12.3635 11.6692 12.3635 11.2109 12.7373L11.1162 12.8232L8.96973 14.9697C8.67688 15.2626 8.67685 15.7374 8.96973 16.0303C9.26261 16.3231 9.73739 16.3231 10.0303 16.0303L11.25 14.8105V18.2119L6 18.2227H5.33301C3.49221 18.2225 2 16.7295 2 14.8887C2.00012 13.0606 3.52692 11.5543 5.34863 11.5557C5.3537 11.5557 5.35874 11.5519 5.35938 11.5469C5.64432 8.43653 8.25968 6.00006 11.4443 6Z"
                                fill="#6D6D6D"
                              />
                            </svg>
                          </div>
                          <p className="mb-1 text-md font-semibold text-white">Upload file</p>
                          <p className="text-sm text-gray-500 dark:text-[#595959]">
                            Drag and drop your PDF here, or click to upload
                          </p>
                        </div>
                      </FileInput>
                      <FileUploaderContent>
                        {files.map((file, i) => (
                          <FileUploaderItem key={i} index={i}>
                            <Paperclip className="h-4 w-4 stroke-current" />
                            <span>{file.name}</span>
                          </FileUploaderItem>
                        ))}
                      </FileUploaderContent>
                    </FileUploader> */}

                    {/* <FileUpload onFileChange={handleFileChange} /> */}


                    <FileUpload
                      existingFiles={existingFiles}
                      onRemoveExisting={(key) => {
                        // remove from existingFiles when user clicks trash
                        setExistingFiles((prev) =>
                          prev.filter((att) => att.key !== key)
                        );
                        // also update form state
                        const remaining = (field.value as any[] || []).filter(
                          (att: any) => att.key !== key
                        );
                        form.setValue("attachments", remaining as any);
                      }}
                      onFileChange={(incomingNew) => {
                        // track newly selected File[] separately
                        setNewFiles(incomingNew);
                        // merge into form’s attachments: existingFiles + new File objects
                        form.setValue(
                          "attachments",
                          // @ts-ignore
                          [...existingFiles, ...incomingNew]
                        );
                      }}
                    />
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
            onClick={form.handleSubmit(onSubmit)}
            className="flex-1 h-10 font-black text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80"
          >
            Continue
          </Button>
        </div>
      </div>



    </div>
  );
}


