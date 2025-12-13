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
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";


const companySchema = z.object({
  website_url: z.string().refine(val => /^((https?:\/\/)?[\w.-]+\.[a-zA-Z]{2,})$/.test(val), {
    message: "Must be a valid website URL",
  }),
  company_name: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  state: z.string().optional(),
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
  state: "",
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

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Watch fields needed for background generation
  const companyName = form.watch("company_name");
  const websiteUrl = form.watch("website_url");
  const country = form.watch("country");
  const product = form.watch("product");
  const competitorsUniqueValueProposition = form.watch("competitors_unique_value_proposition");
  const currentStage = form.watch("current_stage");
  const mainObjective = form.watch("main_objective");
  const targetCustomers = form.watch("target_customers");
  const fundingStatus = form.watch("funding_status");

  // Check if at least one field is filled (or website URL provided)
  const canGenerate = Boolean(
    (websiteUrl && websiteUrl.trim()) ||
    (companyName && companyName.trim()) ||
    (country && country.trim()) ||
    (product && product.trim()) ||
    (competitorsUniqueValueProposition && competitorsUniqueValueProposition.trim()) ||
    (currentStage && currentStage.trim()) ||
    (mainObjective && mainObjective.trim()) ||
    (targetCustomers && targetCustomers.trim()) ||
    (fundingStatus && fundingStatus.trim())
  );

  // Only fetch data if defaultValues are not provided (for backward compatibility)
  // If defaultValues are provided, use them directly - this prevents double fetching
  useEffect(() => {
    // If defaultValues are provided, use them and skip fetching
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      const formData = {
        website_url: defaultValues.website_url ?? "",
        company_name: defaultValues.company_name ?? "",
        country: defaultValues.country ?? "",
        state: defaultValues.state ?? "",
        company_background: defaultValues.company_background ?? "",
        product: defaultValues.product ?? "",
        competitors_unique_value_proposition:
          defaultValues.competitors_unique_value_proposition ?? "",
        current_stage: defaultValues.current_stage ?? "",
        main_objective: defaultValues.main_objective ?? "",
        target_customers: defaultValues.target_customers ?? "",
        funding_status: defaultValues.funding_status ?? "",
        attachments: defaultValues.attachments ?? [],
      };
      form.reset(formData);
      setExistingAttachments(defaultValues.attachments ?? []);
      return;
    }

    // Only fetch if no defaultValues provided (backward compatibility)
    async function fetchCompanyData() {
      try {
        const response = await fetch("/api/company", {
          cache: "no-cache",
        });

        if (!response.ok) {
          console.error(
            "Failed to fetch company data:",
            response.status,
            await response.text()
          );
          return;
        }

        const data: Partial<CompanyDetailsData> = await response.json();

        form.reset({
          website_url: data.website_url ?? "",
          company_name: data.company_name ?? "",
          country: data.country ?? "",
          state: data.state ?? "",
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

        setExistingAttachments(data.attachments ?? []);
      } catch (err) {
        console.error("Error fetching company data:", err);
      }
    }

    fetchCompanyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]);

  const router = useRouter();



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
        state: values.state,
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
      toast.success("Company details saved successfully!");
      setFilesToUpload([]);
      router.refresh();
      setExistingAttachments(finalAttachments);
    } catch (err) {
      console.error("❌  Form submission error:", err);
      toast.error("Failed to save. Try again.");
    } finally {
      setIsSaving(false);
    }
  }



  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto px-8 pt-2 pb-8 mt-4 md:mt-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 w-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NSW">NSW - New South Wales</SelectItem>
                        <SelectItem value="VIC">VIC - Victoria</SelectItem>
                        <SelectItem value="QLD">QLD - Queensland</SelectItem>
                        <SelectItem value="WA">WA - Western Australia</SelectItem>
                        <SelectItem value="SA">SA - South Australia</SelectItem>
                        <SelectItem value="TAS">TAS - Tasmania</SelectItem>
                        <SelectItem value="ACT">ACT - Australian Capital Territory</SelectItem>
                        <SelectItem value="NT">NT - Northern Territory</SelectItem>
                        <SelectItem value="National">National</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  <div className="space-y-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        setIsGenerating(true);
                        try {
                          const formValues = form.getValues();
                          const response = await fetch("/api/generate-company-background", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              company_name: formValues.company_name,
                              website_url: formValues.website_url,
                              country: formValues.country,
                              product: formValues.product,
                              competitors_unique_value_proposition: formValues.competitors_unique_value_proposition,
                              current_stage: formValues.current_stage,
                              main_objective: formValues.main_objective,
                              target_customers: formValues.target_customers,
                              funding_status: formValues.funding_status,
                            }),
                          });

                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.error || "Failed to generate");
                          }

                          const data = await response.json();
                          
                          if (!data.company_background || !data.company_background.trim()) {
                            throw new Error("Generated background is empty. Please try again or provide more information.");
                          }
                          
                          form.setValue("company_background", data.company_background);
                          toast.success("Company background generated successfully!");
                        } catch (err: any) {
                          console.error("Error generating company background:", err);
                          toast.error(err.message || "Failed to generate company background");
                        } finally {
                          setIsGenerating(false);
                        }
                      }}
                      disabled={isGenerating || !canGenerate}
                      className="cursor-pointer mt-1 w-full h-11 flex items-center justify-center gap-2 bg-[#151414] text-white hover:bg-[#151414]/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                    {!canGenerate && !isGenerating && (
                      <p className="text-xs text-muted-foreground">
                        Fill in at least one field above or provide a website URL to generate background
                      </p>
                    )}
                  </div>
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
        <div className="w-full px-8 flex justify-between gap-4">
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
