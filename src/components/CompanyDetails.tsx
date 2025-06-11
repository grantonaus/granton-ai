// components/CompanyDetails.tsx
"use client";

import { useEffect, useState } from "react";
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
import { Loader } from "./Loader";
import { useSession } from "next-auth/react";
import FileUpload from "./FileUpload";
import Spinner from "./Spinner";


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
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        key: z.string(),
      })
    )
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

interface CompanyDetailsProps {
  onSave: (data: CompanyDetailsData) => void;

  defaultValues?: Partial<CompanyDetailsData>;
}

export default function CompanyDetails({
  onSave,
  defaultValues,
}: CompanyDetailsProps) {

  const { data: session } = useSession();

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  const [existingAttachments, setExistingAttachments] = useState<
    { name: string; url: string; key: string }[]
  >([]);

  const handleFileChange = (newFiles: File[] | null) => {
    if (!newFiles) return;
    const pdfFiles = newFiles.filter((f) => f.type === "application/pdf");
    const rejected = newFiles.filter((f) => f.type !== "application/pdf");
    if (rejected.length > 0) {
      toast.error("Only PDF files are allowed");
    }
    const sliced = pdfFiles.slice(0, 3 - existingAttachments.length);
    // ensure total <= 3 once you count existing ones 
    if (sliced.length < pdfFiles.length) {
      toast.error("You can only have up to 3 attachments total");
    }
    setFilesToUpload(sliced);
  };

  const form = useForm<CompanyDetailsData>({
    resolver: zodResolver(companySchema),
    defaultValues: defaultValues ?? blankCompany,
  });


  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const response = await fetch("/api/company", {
          cache: "no-cache",
        });

        console.log("response", response);
        if (!response.ok) {
          console.error(
            "Failed to fetch company data:",
            response.status,
            await response.text()
          );
          return;
        }

        const data: Partial<CompanyDetailsData> = await response.json();
        console.log("↩️  Parsed GET /api/company JSON:", data);

        form.reset({
          website_url: data.website_url ?? "",
          company_name: data.company_name ?? "",
          country: data.country ?? "",
          company_background: data.company_background ?? "",
          product: data.product ?? "",
          competitors_unique_value_proposition:
            data.competitors_unique_value_proposition ?? "",
          current_stage: data.current_stage ?? "",
          main_objective: data.main_objective ?? "",
          target_customers: data.target_customers ?? "",
          funding_status: data.funding_status ?? "",
          attachments: data.attachments ?? [],
        });

        console.log(
          "↩️  Existing attachments array from GET:",
          data.attachments
        );

        setExistingAttachments(data.attachments ?? []);
      } catch (err) {
        console.error("Error fetching company data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanyData();
  }, [form]);



  async function onSubmit(values: CompanyDetailsData) {
    setIsSaving(true);
    console.log("▶️  onSubmit triggered; form values:", values);
    console.log("    existingAttachments:", existingAttachments);
    console.log("    filesToUpload (File objects):", filesToUpload);

    try {
      const uploadedAttachments: { name: string; url: string; key: string }[] =
        [];

      for (const file of filesToUpload) {
        console.log("📁  Processing file:", file.name);

        if (!session?.user?.id) {
          console.warn("⚠️  No session.user.id – aborting upload");
          toast.error("You must be logged in to upload files");
          setIsSaving(false);
          return;
        }
        const userId = session.user.id;
        const fileName = file.name;

        const presignUrl = `/api/s3-upload-url?fileName=${encodeURIComponent(
          fileName
        )}&userId=${encodeURIComponent(userId)}`;
        console.log("    ▶️  Fetching presign URL from:", presignUrl);

        const presignRes = await fetch(presignUrl);
        console.log("    ↩️  presignRes.status:", presignRes.status);

        if (!presignRes.ok) {
          const errText = await presignRes.text().catch(() => "(no text)");
          console.error("❌  Failed to get presigned URL:", errText);
          toast.error(`Could not get upload URL for ${fileName}`);
          continue;
        }

        const { uploadUrl, key } = await presignRes.json();

        console.log("📤 Uploading to presigned URL…", uploadUrl);

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/pdf",
          },
        });

        console.log("📤 S3 PUT status:", uploadRes.status);

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          console.error("❌ Upload failed:", errorText);
          toast.error(`Failed to upload ${file.name}: ${uploadRes.status}`);
          return;
        }

        const objectUrl =
          `https://company-attachments-bucket.s3.eu-north-1.amazonaws.com/` +
          encodeURIComponent(key);
        console.log("    ↩️  Successfully uploaded; objectUrl:", objectUrl);

        uploadedAttachments.push({ name: fileName, url: objectUrl, key });
      }

      const finalAttachments = [
        ...existingAttachments.filter(
          (ea) => !uploadedAttachments.some((ua) => ua.key === ea.key)
        ),
        ...uploadedAttachments,
      ];
      console.log("🔗  finalAttachments to send:", finalAttachments);

      const payload: CompanyDetailsData = {
        company_name: values.company_name,
        website_url: values.website_url,
        country: values.country,
        company_background: values.company_background,
        product: values.product,
        competitors_unique_value_proposition:
          values.competitors_unique_value_proposition,
        current_stage: values.current_stage,
        main_objective: values.main_objective,
        target_customers: values.target_customers,
        funding_status: values.funding_status,
        attachments: finalAttachments,
      };

      console.log("▶️  POST payload to /api/company:", JSON.stringify(payload));

      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("↩️  POST /api/company status:", res.status);

      if (!res.ok) {
        const errText = await res.text().catch(() => "(no text)");
        console.error("❌  Failed to save company data:", errText);
        toast.error("Failed to save. Try again.");
        setIsSaving(false);
        return;
      }

      console.log("✅  Company details + attachments saved successfully");
      toast.success("Company details + attachments saved!");
      setFilesToUpload([]);
      setExistingAttachments(finalAttachments);
    } catch (err) {
      console.error("❌  Form submission error:", err);
      toast.error("Failed to save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }



  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2 pb-8 mt-4 md:mt-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-w-[960px] mx-auto"
          >
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
                      placeholder="What does your company/project do? Give an overview of your products/services. What problems are you trying to solve?"
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select objective" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="raise_capital">
                        Raise Capital
                      </SelectItem>
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
                      placeholder="What does your company/project do? Give an overview of your products/services. What problems are you trying to solve?"
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                      existingFiles={existingAttachments}
                      onRemoveExisting={(keyToRemove) =>
                        setExistingAttachments((prev) =>
                          prev.filter((att) => att.key !== keyToRemove)
                        )
                      }
                      onFileChange={(newFiles: File[]) => {
                        setFilesToUpload(newFiles);
                      }}
                      acceptedTypes=".pdf"
                      maxFiles={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </form>
        </Form>
      </div>

      <div className="bg-[#0F0F0F]/80 backdrop-blur-xs pt-4 pb-6 md:pb-8">
        <div className="max-w-[1000px] mx-auto flex justify-between gap-4 px-5">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className="w-full h-10 font-black text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 cursor-pointer"
            disabled={isSaving}
          >
            <Loader loading={isSaving}>Save Changes</Loader>
          </Button>
        </div>
      </div>
    </div>
  );
}
