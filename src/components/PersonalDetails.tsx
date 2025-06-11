// components/PersonalDetails.tsx
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { Loader } from "./Loader";

const personalSchema = z.object({
    primary_first_name: z.string().min(1, "First name is required"),
    primary_last_name: z.string().min(1, "Last name is required"),

    contact_salutation: z.string().min(1, "Salutation is required"),
    contact_job_title: z.string().min(1, "Job title is required"),
    contact_first_name: z.string().min(1, "First name is required"),
    contact_last_name: z.string().min(1, "Last name is required"),
    contact_email: z.string().email("Must be a valid email"),
    contact_mobile: z.string().min(1, "Mobile number is required"),
});

export type PersonalDetailsData = z.infer<typeof personalSchema>;

const blankPersonal: PersonalDetailsData = {
    primary_first_name: "",
    primary_last_name: "",
    contact_salutation: "",
    contact_job_title: "",
    contact_first_name: "",
    contact_last_name: "",
    contact_email: "",
    contact_mobile: "",
};

interface PersonalDetailsProps {
    onSave: (data: PersonalDetailsData) => void;
    defaultValues?: Partial<PersonalDetailsData>;
}

export default function PersonalDetails({
    onSave,
    defaultValues,
}: PersonalDetailsProps) {
    const form = useForm<PersonalDetailsData>({
        resolver: zodResolver(personalSchema),
        defaultValues: defaultValues ?? blankPersonal,
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (values: PersonalDetailsData) => {
        setIsSaving(true);
        try {
          const resp = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
    
          if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            console.error("Failed to save", body);
            toast.error("Error saving personal details. Please try again.");
            setIsSaving(false);
            return;
          }
    
          toast.success("Personal details saved successfully!");
          setIsSaving(false);
        } catch (err) {
          console.error("Unexpected error", err);
          toast.error("Unexpected error. Please try again.");
          setIsSaving(false);
        }
      };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-4 pb-8 mt-2 md:mt-5">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSave)}
                        className="space-y-8 md:space-y-12 max-w-[960px] mx-auto"
                    >
                        <div className="space-y-2">
                            <p className="text-[16px] font-bold text-white mb-6">Primary Contact</p>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="col-span-1 md:col-span-6">
                                    <FormField
                                        control={form.control}
                                        name="primary_first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="First Name"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-6">
                                    <FormField
                                        control={form.control}
                                        name="primary_last_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Last Name"
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
                        </div>

                        <div className="space-y-2">
                            <p className="text-[16px] font-bold text-white mb-6">
                                Main Contact for Project
                            </p>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="contact_salutation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Salutation</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Mr./Ms./Dr."
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-10">
                                    <FormField
                                        control={form.control}
                                        name="contact_job_title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Job Title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Job Title"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-6">
                                    <FormField
                                        control={form.control}
                                        name="contact_first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="First Name"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-6">
                                    <FormField
                                        control={form.control}
                                        name="contact_last_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Last Name"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-6">
                                    <FormField
                                        control={form.control}
                                        name="contact_email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="email@example.com"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-6">
                                    <FormField
                                        control={form.control}
                                        name="contact_mobile"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mobile #</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="+1 (XXX) XXX-XXXX"
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
                        </div>

                    </form>
                </Form>
            </div>

            <div className="bg-[#0F0F0F]/80 backdrop-blur-xs pt-4 pb-6 md:pb-8">
                <div className="max-w-[1000px] mx-auto flex justify-between gap-4 px-5">
                    <Button
                        onClick={form.handleSubmit(handleSave)}
                        className="w-full h-10 font-black text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 cursor-pointer"
                        disabled={isSaving}
                    >
                        <Loader loading={isSaving}>Save</Loader>
                    </Button>
                </div>
            </div>
        </div >
    );
}
