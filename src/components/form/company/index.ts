// app/lib/validations/company.ts
import { z } from "zod";

export const CompanySchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  website_url: z
    .string()
    // .url("Must be a valid URL")
    .min(1, "Website URL is required"),
  country: z.string().min(1, "Country is required"),
  company_background: z.string().min(1, "Company background is required"),
  product: z.string().min(1, "Product/Service is required"),
  competitors_unique_value_proposition: z
    .string()
    .min(1, "Unique value proposition is required"),
  current_stage: z.string().min(1, "Current stage is required"),
  main_objective: z.string().min(1, "Main objective is required"),
  target_customers: z.string().min(1, "Target customers are required"),
  funding_status: z.string().min(1, "Funding status is required"),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1, "Attachment name is required"),
        url: z.string().url("Attachment URL must be valid"),
        key: z.string().min(1, "Attachment key is required"),
      })
    )
    // .optional()
    .default([]),
});

// Type we can reuse in both client & server
export type CompanyForm = z.infer<typeof CompanySchema>;
