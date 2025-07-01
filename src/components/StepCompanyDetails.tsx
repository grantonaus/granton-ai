
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
import FileUpload from "./FileUpload";
import { Loader } from "./Loader";

const PdfFile = z.custom<File>(
  (f) => f instanceof File && f.type === "application/pdf",
  { message: "Only PDF files are allowed" }
);

const ExistingAttachment = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  key: z.string().min(1),
});

const Attachment = z.union([PdfFile, ExistingAttachment]);

const companySchema = z.object({
  website_url: z.string().refine(val => /^((https?:\/\/)?[\w.-]+\.[a-zA-Z]{2,})$/.test(val), {
    message: "Must be a valid website URL",
  }),
  company_name: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  company_background: z.string().min(1, "Required"),
  product: z.string().min(1, "Required"),
  competitors_unique_value_proposition: z.string().min(1, "Required"),
  current_stage: z.string().min(1, "Required"),
  main_objective: z.string().min(1, "Required"),
  target_customers: z.string().min(1, "Required"),
  funding_status: z.string().min(1, "Required"),
  attachments: z
    .array(Attachment)
    .max(3, "You can have at most 3 attachments")
    .optional(),
});

export type CompanyDetailsData = z.infer<typeof companySchema>;

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

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [existingFiles, setExistingFiles] = useState<
    { name: string; url: string; key: string }[]
  >(defaultValues?.attachments as any[] || []);

  const [newFiles, setNewFiles] = useState<File[]>([]);

  const handleFileChange = (newFiles: File[]) => {
    const pdfFiles = newFiles.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length > 3) {
      toast.error("You can upload up to 3 PDF files only.");
      pdfFiles.splice(3); 
    }
    setNewFiles(pdfFiles);
    form.setValue("attachments", pdfFiles);
  };


  const form = useForm<CompanyDetailsData>({
    resolver: zodResolver(companySchema),
    defaultValues: defaultValues ?? blankCompany,
  });

  async function onSubmit(values: CompanyDetailsData) {
    try {
      setIsSaving(true)
      await onNext(values);
    } catch (error) {
      console.error("Form submission error", error);
      toast.error("Failed to submit the form. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
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

            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachments (Optional)</FormLabel>
                  <FormControl>

                    <FileUpload
                      existingFiles={existingFiles}
                      onRemoveExisting={(key) => {
                        setExistingFiles((prev) =>
                          prev.filter((att) => att.key !== key)
                        );
                        const remaining = (field.value as any[] || []).filter(
                          (att: any) => att.key !== key
                        );
                        form.setValue("attachments", remaining as any);
                      }}
                      onFileChange={(incomingNew) => {
                        setNewFiles(incomingNew);
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

      <div className="bg-[#0F0F0F]/80 backdrop-blur-xs pt-4 pb-6 md:pb-8">
        <div className="max-w-[960px] mx-auto flex justify-between gap-4">
          <Button
            disabled={isSaving}
            onClick={form.handleSubmit(onSubmit)}
            className="flex-1 h-10 font-black text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 cursor-pointer"
          >
            <Loader loading={isSaving}>Continue</Loader>
          </Button>
        </div>
      </div>
    </div>
  );
}


