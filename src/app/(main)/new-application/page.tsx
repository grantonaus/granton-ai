
"use client";

import { useEffect, useState } from "react";
import { ContentLayout } from "@/components/ContentLayout";
import StepCompanyDetails, { CompanyDetailsData } from "@/components/StepCompanyDetails";
import StepGrantDetails, { GrantDetailsData } from "@/components/StepGrantDetails";
import { StepTracker } from "@/components/Stepper";
import BudgetDetailsDetails, { BudgetDetailsData } from "@/components/StepBudget";
import AdditionalQuestions from "@/components/StepAdditionalQuestions";
import Finalise from "@/components/StepFinalise";
import { Banner } from "@/components/Banner";
import { usePersonal } from "@/contexts/PersonalContext";
import Spinner from "@/components/Spinner";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/user";

export default function NewApplicationPage() {

  const { session } = useCurrentUser();

  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);

  const [currentStep, setCurrentStep] = useState(4);

  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsData>();
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  const [grantDetails, setGrantDetails] = useState<GrantDetailsData>();
  const [aiGrantRequirements, setAiGrantRequirements] = useState<string>("");

  const [formQuestionsMarkdown, setFormQuestionsMarkdown] = useState<string>("");

  const [budgetDetails, setBudgetDetails] = useState<BudgetDetailsData>();

  const { hasPersonalDetails, setHasPersonalDetails } = usePersonal();

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // const handleCompanyNext = (data: CompanyDetailsData) => {
  //   setCompanyDetails(data);
  //   nextStep();

  // };


  async function handleCompanyNext(data: CompanyDetailsData) {

    // Keep a local copy so we can show defaults if they navigate backward
    setCompanyDetails(data);

    // 2.a) Separate “new” File objects vs “existing” attachments
    //     StepCompanyDetails hands us `data.attachments` as (File | {name,url,key})[]
    const newFiles: File[] = [];
    const existingAttachments: Array<{ name: string; url: string; key: string }> = [];

    (data.attachments || []).forEach((att) => {
      if (att instanceof File) {
        newFiles.push(att);
      } else {
        existingAttachments.push({ name: att.name, url: att.url, key: att.key });
      }
    });

    // 2.b) Upload each new PDF to S3 via presigned URLs
    //     Build an array: uploadedAttachments: {name,url,key}[]
    const uploadedAttachments: Array<{ name: string; url: string; key: string }> = [];

    for (const file of newFiles) {
      try {
        // 2.b.1) Get a presigned URL from our backend
        const presignRes = await fetch(
          `/api/s3-upload-url?fileName=${encodeURIComponent(file.name)}&userId=${encodeURIComponent(
            session!.user.id!
          )}`
        );
        if (!presignRes.ok) {
          const errTxt = await presignRes.text().catch(() => "no text");
          console.error("🛑 Failed to get presigned URL for", file.name, ":", errTxt);
          continue;
        }
        const { uploadUrl, key } = await presignRes.json();

        // 2.b.2) PUT the file into S3
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/pdf" },
        });
        if (!uploadRes.ok) {
          const text = await uploadRes.text().catch(() => "(no text)");
          console.error("🛑 S3 upload failed for", file.name, ":", text);
          continue;
        }

        // 2.b.3) Construct the public‐read URL (adjust if your bucket is private or uses a different region/name)
        const objectUrl = `https://company-attachments-bucket.s3.eu-north-1.amazonaws.com/${encodeURIComponent(
          key
        )}`;

        uploadedAttachments.push({ name: file.name, url: objectUrl, key });
      } catch (err) {
        console.error("🛑 Exception uploading file:", file.name, err);
      }
    }

    // 2.c) Merge “existing” + “just uploaded” attachments
    const finalAttachments = [
      // filter out any existing attachments that might have been replaced,
      // but since Step 1 UI only removes them when user clicks “trash,” 
      // we can safely assume none of the keys of `existingAttachments` overlap:
      ...existingAttachments,
      ...uploadedAttachments,
    ];

    // 2.d) Build the JSON for /api/company
    const payload: CompanyDetailsData = {
      website_url: data.website_url,
      company_name: data.company_name,
      country: data.country,
      company_background: data.company_background,
      product: data.product,
      competitors_unique_value_proposition: data.competitors_unique_value_proposition,
      current_stage: data.current_stage,
      main_objective: data.main_objective,
      target_customers: data.target_customers,
      funding_status: data.funding_status,
      attachments: finalAttachments,
    };

    // 2.e) POST the full payload to /api/company
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => "no text");
        console.error("🛑 Failed to save company data:", res.status, errTxt);
        return; // bail before moving to next step
      }

      // 2.f) Only once the backend confirms, we actually move on
      nextStep();
    } catch (err) {
      console.error("🛑 Error calling /api/company:", err);
      return;
    }
  }

  // In your handleGrantNext(...) from StepGrantDetails:

  const handleGrantNext = async (data: GrantDetailsData) => {
    setGrantDetails(data);

    console.log("GrantDetails payload:", data);

    const form = new FormData();

    if (data.guidelinesFile) {
      form.append("guidelinesFile", data.guidelinesFile);
    } else if (data.guidelinesLink?.trim()) {
      form.append("guidelinesLink", data.guidelinesLink.trim());
    }

    if (data.applicationFormFile) {
      form.append("applicationFormFile", data.applicationFormFile);
    } else if (data.applicationFormLink?.trim()) {
      form.append("applicationFormLink", data.applicationFormLink.trim());
    }

    try {
      const res = await fetch("/api/ai_budget", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        console.error("Extraction failed:", res.status, await res.text());
        setAiGrantRequirements("");
      } else {
        const json: { aiGrantExtraction: string } = await res.json();
        setAiGrantRequirements(json.aiGrantExtraction);
      }
    } catch (err) {
      console.error("Error calling /api/ai_budget:", err);
      setAiGrantRequirements("");
    }

    nextStep();
  };


  const handleBudgetNext = async (data: BudgetDetailsData) => {
    setBudgetDetails(data);
    nextStep(); // Step 4 (AdditionalQuestions) will do the fetch.
  };


  useEffect(() => {
    async function loadCompanyData() {
      try {
        const res = await fetch("/api/company", { cache: "no-cache" });
        if (!res.ok) {
          // 401, 404, or 500 – just leave companyDetails undefined
          console.error(
            "Failed to fetch company data:",
            res.status,
            await res.text()
          );
          return;
        }
        const data: CompanyDetailsData = await res.json();
        // Populate state so Step 1 receives defaultValues
        setCompanyDetails(data);
      } catch (err) {
        console.error("Error fetching company data:", err);
      } finally {
        setIsLoadingCompany(false);
      }
    }

    loadCompanyData();
  }, []);



  const submitAll = () => {
    const payload = {
      ...companyDetails,
      ...grantDetails,
      ...budgetDetails,
    };
    console.log("🗂️ Final payload:", payload);
  };




  return (
    <ContentLayout title="New Grant Application">
      {/* 
        ── 3) Wrap everything inside a flex‐column that fills the space. ──
        The StepTracker sits at the top, and the step content occupies the rest.
      */}
      <div className="flex flex-col h-full px-5 min-[1340px]:px-0">

        {/* <Banner /> */}
        {!hasPersonalDetails && (
          <Banner />
        )}

        <StepTracker currentStep={currentStep} onStepClick={setCurrentStep} />

        {/* 
          ── 4) The area for each step: make it flex-1 and hidden overflow.
          This ensures each step’s own scroll logic works inside it.
        */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 1 && (
            <>
              {isLoadingCompany ? (
                // Optionally show a spinner or a “Loading…” placeholder
                <div className="h-[75vh] flex-1 flex items-center justify-center text-gray-400">
                  <Spinner />
                </div>
              ) : (
                /* Pass `companyDetails` (possibly undefined) as defaultValues */
                <StepCompanyDetails
                  defaultValues={companyDetails}
                  onNext={handleCompanyNext}
                />
              )}
            </>
          )}


          {currentStep === 2 && (
            <StepGrantDetails
              defaultValues={grantDetails}
              onNext={handleGrantNext}
              onBack={prevStep}
            />
          )}

          {currentStep === 3 && (
            <BudgetDetailsDetails
              defaultValues={budgetDetails}
              onNext={handleBudgetNext}
              onBack={prevStep}
              grantValues={grantDetails}
              grantRequirements={aiGrantRequirements}
            />
          )}

          {/* {currentStep === 4 && <AdditionalQuestions onBack={prevStep} onNext={nextStep} />} */}

          {/* {currentStep === 4 && ( */}
          {currentStep === 4 && companyDetails && grantDetails && budgetDetails && (
            <AdditionalQuestions
              onBack={prevStep}
              onNext={nextStep}
              companyDetails={companyDetails} 
              grantDetails={grantDetails}    
              budgetDetails={budgetDetails}   
              applicationFormFile={grantDetails?.applicationFormFile ?? null}
              applicationFormLink={grantDetails?.applicationFormLink ?? ""}
            />
          )}

          {currentStep === 5 && <Finalise />}
        </div>
      </div>
    </ContentLayout>
  );
}

