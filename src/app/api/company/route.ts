import { NextRequest, NextResponse } from "next/server";

import { s3Client, S3_BUCKET } from "@/lib/s3-client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "@/lib/auth-server";
import { client } from "@/lib/prisma";
import { CompanySchema } from "@/components/form/company";
import { createSession } from "@/lib/auth-custom";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
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
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in GET /api/company:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const json = await req.json();
    const result = CompanySchema.safeParse(json);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: fieldErrors },
        { status: 422 }
      );
    }
    const data = result.data;

    const existing = await client.user.findUnique({
      where: { id: userId },
      select: { attachments: true },
    });
    const oldAttachments =
      (existing?.attachments as { name: string; url: string; key: string }[]) ||
      [];
    const newAttachments: { name: string; url: string; key: string }[] =
      data.attachments;

    const removed = oldAttachments.filter(
      (oldA) => !newAttachments.some((na) => na.key === oldA.key)
    );
    await Promise.all(
      removed.map((rem) =>
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: rem.key,
          })
        )
      )
    );

    await client.user.update({
      where: { id: userId },
      data: {
        companyName: data.company_name,
        websiteUrl: data.website_url,
        country: data.country,
        state: data.state || null,
        companyBackground: data.company_background,
        product: data.product,
        competitorsUniqueValueProposition:
          data.competitors_unique_value_proposition,
        currentStage: data.current_stage,
        mainObjective: data.main_objective,
        targetCustomers: data.target_customers,
        fundingStatus: data.funding_status,
        attachments: newAttachments as object,
        companyComplete: true,
      },
    });

    await createSession(userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error in POST /api/company:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
