// import { NextRequest, NextResponse } from "next/server";
// import { client } from "@/lib/prisma";
// import { z } from "zod";
// import { auth } from "../../../../auth";
// import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";


// const CompanySchema = z.object({
//     company_name: z.string().min(1, "Company name is required"),
//     website_url: z.string().url("Must be a valid URL"),
//     country: z.string().min(1, "Country is required"),
//     company_background: z.string().min(1, "Company background is required"),
//     product: z.string().min(1, "Product/Service is required"),
//     competitors_unique_value_proposition: z
//         .string()
//         .min(1, "Unique value proposition is required"),
//     current_stage: z.string().min(1, "Current stage is required"),
//     main_objective: z.string().min(1, "Main objective is required"),
//     target_customers: z.string().min(1, "Target customers is required"),
//     funding_status: z.string().min(1, "Funding status is required"),
//     attachments: z
//     .array(
//       z.object({
//         name: z.string().min(1),
//         url: z.string().url(),
//         key: z.string().min(1),
//       })
//     )
//     .optional()
//     .default([]),
// });

// const REGION = process.env.AWS_REGION!;
// const BUCKET = process.env.S3_BUCKET_NAME!;
// const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID!;
// const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

// console.log("BUCKET:", BUCKET);

// if (!REGION || !BUCKET || !ACCESS_KEY || !SECRET_KEY) {
//     throw new Error(
//       "Missing one of AWS_REGION, S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, or AWS_SECRET_ACCESS_KEY"
//     );
//   }
  
//   // ─── Initialize a server-side S3 client (with service credentials) ─────────
//   const s3Client = new S3Client({
//     region: REGION,
//     credentials: {
//       accessKeyId: ACCESS_KEY,
//       secretAccessKey: SECRET_KEY,
//     },
//   });

// export async function GET(req: NextRequest) {
//     try {
//         const session = await auth();
//         if (!session?.user?.id) {
//             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }
//         const userId = session.user.id;

//         const userRecord = await client.user.findUnique({
//             where: { id: userId },
//             select: {
//                 companyName: true,
//                 websiteUrl: true,
//                 country: true,
//                 companyBackground: true,
//                 product: true,
//                 competitorsUniqueValueProposition: true,
//                 currentStage: true,
//                 mainObjective: true,
//                 targetCustomers: true,
//                 fundingStatus: true,
//                 attachments: true,
//             },
//         });

//         if (!userRecord) {
//             return NextResponse.json({ error: "User not found" }, { status: 404 });
//         }

//         return NextResponse.json(
//             {
//                 company_name: userRecord.companyName ?? "",
//                 website_url: userRecord.websiteUrl ?? "",
//                 country: userRecord.country ?? "",
//                 company_background: userRecord.companyBackground ?? "",
//                 product: userRecord.product ?? "",
//                 competitors_unique_value_proposition:
//                     userRecord.competitorsUniqueValueProposition ?? "",
//                 current_stage: userRecord.currentStage ?? "",
//                 main_objective: userRecord.mainObjective ?? "",
//                 target_customers: userRecord.targetCustomers ?? "",
//                 funding_status: userRecord.fundingStatus ?? "",
//                 attachments: (userRecord.attachments as { name: string; url: string; key: string }[]) || [],
//             },
//             { status: 200 }
//         );
//     } catch (err) {
//         console.error("Error in GET /api/company:", err);
//         return NextResponse.json(
//             { error: "Internal Server Error" },
//             { status: 500 }
//         );
//     }
// }

// export async function POST(req: NextRequest) {

//     try {

//         const session = await auth();
//         if (!session?.user?.id) {
//             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//         }
//         const userId = session.user.id;


//         const body = await req.json();
//         const parseResult = CompanySchema.safeParse(body);

//         if (!parseResult.success) {
//             const fieldErrors = parseResult.error.flatten().fieldErrors;
//             return NextResponse.json(
//                 { error: "Validation failed", details: fieldErrors },
//                 { status: 422 }
//             );
//         }

//         const data = parseResult.data;


//         const userRecord = await client.user.findUnique({
//             where: { id: userId },
//             select: { attachments: true },
//           });
//           const oldAttachments: { name: string; url: string; key: string }[] =
//             (userRecord?.attachments as { name: string; url: string; key: string }[]) || [];
      
//           const newAttachments = data.attachments || [];
      
//           const removed = oldAttachments.filter(
//             (oldA) => !newAttachments.some((na) => na.key === oldA.key)
//           );
      
//           for (const rem of removed) {
//             try {
//               await s3Client.send(
//                 new DeleteObjectCommand({
//                   Bucket: BUCKET,
//                   Key: rem.key,
//                 })
//               );
//             } catch (deleteErr) {
//               console.error("Error deleting S3 object", rem.key, deleteErr);
//             }
//           }

//         await client.user.update({
//             where: { id: userId },
//             data: {
//                 companyName: data.company_name,
//                 websiteUrl: data.website_url,
//                 country: data.country,
//                 companyBackground: data.company_background,
//                 product: data.product,
//                 competitorsUniqueValueProposition:
//                     data.competitors_unique_value_proposition,
//                 currentStage: data.current_stage,
//                 mainObjective: data.main_objective,
//                 targetCustomers: data.target_customers,
//                 fundingStatus: data.funding_status,
//                 profileComplete: true,
//                 attachments: newAttachments as object,
//             },
//         });


//         return NextResponse.json({ success: true }, { status: 200 });
//     } catch (err) {
//         console.error("Error in POST /api/company:", err);
//         return NextResponse.json(
//             { error: "Internal Server Error" },
//             { status: 500 }
//         );
//     }
// }



// app/api/company/route.ts
import { NextRequest, NextResponse } from "next/server";

import { s3Client, S3_BUCKET } from "@/lib/s3-client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "../../../../auth";
import { client } from "@/lib/prisma";
import { CompanySchema } from "@/components/form/company";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
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

    // Shape it exactly like CompanyForm
    return NextResponse.json(
      {
        company_name: record.companyName ?? "",
        website_url: record.websiteUrl ?? "",
        country: record.country ?? "",
        company_background: record.companyBackground ?? "",
        product: record.product ?? "",
        competitors_unique_value_proposition:
          record.competitorsUniqueValueProposition ?? "",
        current_stage: record.currentStage ?? "",
        main_objective: record.mainObjective ?? "",
        target_customers: record.targetCustomers ?? "",
        funding_status: record.fundingStatus ?? "",
        attachments:
          (record.attachments as { name: string; url: string; key: string }[]) || [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in GET /api/company:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const json = await req.json(); // expecting the client to send JSON matching CompanyForm
    const result = CompanySchema.safeParse(json);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: fieldErrors },
        { status: 422 }
      );
    }
    const data = result.data; // data: CompanyForm

    // Fetch the existing attachments array to see which ones were removed
    const existing = await client.user.findUnique({
      where: { id: userId },
      select: { attachments: true },
    });
    const oldAttachments =
      (existing?.attachments as { name: string; url: string; key: string }[]) || [];
    const newAttachments: { name: string; url: string; key: string }[] =
      data.attachments;

    // Find which keys were removed
    const removed = oldAttachments.filter(
      (oldA) => !newAttachments.some((na) => na.key === oldA.key)
    );
    // Delete them from S3
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

    // Update the Prisma record
    await client.user.update({
      where: { id: userId },
      data: {
        companyName: data.company_name,
        websiteUrl: data.website_url,
        country: data.country,
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Error in POST /api/company:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
