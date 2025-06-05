import * as z from "zod";

export const PersonalSchema = z.object({
  primary_first_name: z.string().min(1, "First name is required"),
  primary_last_name: z.string().min(1, "Last name is required"),
  contact_salutation: z.string().min(1, "Salutation is required"),
  contact_job_title: z.string().min(1, "Job title is required"),
  contact_first_name: z.string().min(1, "First name is required"),
  contact_last_name: z.string().min(1, "Last name is required"),
  contact_email: z.string().email("Must be a valid email"),
  contact_mobile: z.string().min(1, "Mobile number is required"),
});

export type PersonalDetailsData = z.infer<typeof PersonalSchema>;