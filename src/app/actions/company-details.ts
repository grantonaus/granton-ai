"use server";

import { getServerSession } from "@/lib/auth-server";
import { client } from "@/lib/prisma";
import type { CompanyDetailsData } from "@/components/CompanyDetails";

export async function getCompanyDetails(): Promise<CompanyDetailsData | null> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return null;
    }

    const userId = session.user.id;

    const record = await client.user.findUnique({
      where: { id: userId },
      select: {
        companyName: true,
        websiteUrl: true,
        country: true,
        state: true,
        companyBackground: true,
        product: true,
        competitorsUniqueValueProposition: true,
        currentStage: true,
        mainObjective: true,
        targetCustomers: true,
        fundingStatus: true,
        attachments: true,
      },
    });

    if (!record) {
      return null;
    }

    return {
      company_name: record.companyName ?? "",
      website_url: record.websiteUrl ?? "",
      country: record.country ?? "",
      state: record.state ?? "",
      company_background: record.companyBackground ?? "",
      product: record.product ?? "",
      competitors_unique_value_proposition:
        record.competitorsUniqueValueProposition ?? "",
      current_stage: record.currentStage ?? "",
      main_objective: record.mainObjective ?? "",
      target_customers: record.targetCustomers ?? "",
      funding_status: record.fundingStatus ?? "",
      attachments:
        (record.attachments as { name: string; url: string; key: string }[]) ||
        [],
    };
  } catch (error) {
    console.error("Error fetching company details:", error);
    return null;
  }
}

