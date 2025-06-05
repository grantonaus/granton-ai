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
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";
import { Paperclip } from "lucide-react";
import { Loader } from "./Loader";
import { useSession } from "next-auth/react";
import FileUpload from "./FileUpload";


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

  // const handleFileChange = (newFiles: File[] | null) => {
  //   if (!newFiles) return;
  //   const pdfFiles = newFiles.filter((f) => f.type === "application/pdf");
  //   const rejected = newFiles.filter((f) => f.type !== "application/pdf");
  //   if (rejected.length > 0) {
  //     toast.error("Only PDF files are allowed");
  //   }
  //   const sliced = pdfFiles.slice(0, 3);
  //   setFiles(sliced);
  //   form.setValue("attachments", sliced);
  // };

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


  const removeExistingAttachment = (keyToRemove: string) => {
    setExistingAttachments((prev) =>
      prev.filter((att) => att.key !== keyToRemove)
    );
  };


  const dropZoneConfig = {
    maxFiles: 3,
    maxSize: 4 * 1024 * 1024, // 4 MB
    multiple: true,
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

        // ── 2.1) Request presigned URL
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

        // const json = await presignRes.json();
        // console.log("🪵  Raw presign JSON response:", json);

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

        // Build the object URL assuming bucket is public-read
        const objectUrl =
          `https://company-attachments-bucket.s3.eu-north-1.amazonaws.com/` +
          encodeURIComponent(key);
        console.log("    ↩️  Successfully uploaded; objectUrl:", objectUrl);

        uploadedAttachments.push({ name: fileName, url: objectUrl, key });
      }

      // ── 2.3) Merge attachments arrays
      const finalAttachments = [
        ...existingAttachments.filter(
          (ea) => !uploadedAttachments.some((ua) => ua.key === ea.key)
        ),
        ...uploadedAttachments,
      ];
      console.log("🔗  finalAttachments to send:", finalAttachments);

      // ── 2.4) Build final payload
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

      // ── 2.5) Send payload to backend
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
        <svg
          aria-hidden="true"
          className="w-6 h-6 text-[#1c1c1c] animate-spin fill-[#68FCF2]"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 
                 50 100.591C22.3858 100.591 0 78.2051 
                 0 50.5908C0 22.9766 22.3858 0.59082 
                 50 0.59082C77.6142 0.59082 100 22.9766 
                 100 50.5908ZM9.08144 50.5908C9.08144 
                 73.1895 27.4013 91.5094 50 91.5094C72.5987 
                 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 
                 27.9921 72.5987 9.67226 50 9.67226C27.4013 
                 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 
                 35.9116 97.0079 33.5539C95.2932 28.8227 
                 92.871 24.3692 89.8167 20.348C85.8452 
                 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 
                 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 
                 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 
                 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 
                 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 
                 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 
                 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 
                 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 
                 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 
                 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
      </div>
    );
  }

  return (
    // ───────────── 3) Top‐level flex container ───────────────────────────
    <div className="flex flex-col h-full">
      {/* ─────── 4) Scrollable form region ───────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2 pb-8 mt-4 md:mt-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-w-[960px] mx-auto"
          >
            {/* 1) Website URL | Company Name | Country */}
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

            {/* 5) Competitors / UVP */}
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
                    <FileUpload
                      existingFiles={existingAttachments}
                      onRemoveExisting={(keyToRemove) =>
                        setExistingAttachments((prev) =>
                          prev.filter((att) => att.key !== keyToRemove)
                        )
                      }
                      onFileChange={(newFiles: File[]) => {
                        // store new File objects so onSubmit can upload them
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

      {/* ─── 5) Fixed footer at bottom: single “Save” button ───────────────────── */}
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
