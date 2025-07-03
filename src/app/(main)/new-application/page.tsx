"use client";

import { useEffect, useState } from "react";
import { ContentLayout } from "@/components/ContentLayout";
import StepCompanyDetails, { CompanyDetailsData } from "@/components/StepCompanyDetails";
import StepGrantDetails, { GrantDetailsData } from "@/components/StepGrantDetails";
import { StepTracker } from "@/components/Stepper";
import BudgetDetailsDetails, { BudgetDetailsData } from "@/components/StepBudget";
import AdditionalQuestions, { Message } from "@/components/StepAdditionalQuestions";
import Finalise from "@/components/StepFinalise";
import { Banner } from "@/components/Banner";
import { usePersonal } from "@/contexts/PersonalContext";
import Spinner from "@/components/Spinner";
import { useCurrentUser } from "@/hooks/user";
import { isProfileComplete } from "@/app/actions/profile-complete";
import { loadStripe } from "@stripe/stripe-js";

export default function NewApplicationPage() {

  const { session } = useCurrentUser();
  const { hasPersonalDetails, hasCompanyDetails } = usePersonal();

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

  const [checkingPayment, setCheckingPayment] = useState(true);

  const [currentStep, setCurrentStep] = useState(1);


  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsData>();
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  const [grantDetails, setGrantDetails] = useState<GrantDetailsData>();
  const [aiGrantRequirements, setAiGrantRequirements] = useState<string>("");

  const [formQuestionsMarkdown, setFormQuestionsMarkdown] = useState<string>("");

  const [budgetDetails, setBudgetDetails] = useState<BudgetDetailsData>();

  const [combinedFormText, setCombinedFormText] = useState<string>("");

  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [generatedApplication, setGeneratedApplication] = useState<string>("");
  const [applicationTitle, setApplicationTitle] = useState<string>("Grant_Application")

  const [submitting, setSubmitting] = useState(false);

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  async function handleCompanyNext(data: CompanyDetailsData) {

    // setCompanyDetails(data);

    const newFiles: File[] = [];
    const existingAttachments: Array<{ name: string; url: string; key: string }> = [];

    (data.attachments || []).forEach((att) => {
      if (att instanceof File) {
        newFiles.push(att);
      } else {
        existingAttachments.push({ name: att.name, url: att.url, key: att.key });
      }
    });

    const uploadedAttachments: Array<{ name: string; url: string; key: string }> = [];

    for (const file of newFiles) {
      try {
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

        const objectUrl = `https://company-attachments-bucket.s3.eu-north-1.amazonaws.com/${encodeURIComponent(
          key
        )}`;

        uploadedAttachments.push({ name: file.name, url: objectUrl, key });
      } catch (err) {
        console.error("🛑 Exception uploading file:", file.name, err);
      }
    }

    const finalAttachments = [
      ...existingAttachments,
      ...uploadedAttachments,
    ];

    const updatedCompany: CompanyDetailsData = {
      ...data,
      attachments: finalAttachments,
    };
    setCompanyDetails(updatedCompany);
  

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

    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errTxt = await res.text().catch(() => "no text");
        console.error("🛑 Failed to save company data:", res.status, errTxt);
        return; 
      }

      console.log("company payload:", payload)

      nextStep();
    } catch (err) {
      console.error("🛑 Error calling /api/company:", err);
      return;
    }
  }


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
    nextStep();
  };


  useEffect(() => {
    async function loadCompanyData() {
      try {
        const res = await fetch("/api/company", { cache: "no-cache" });
        if (!res.ok) {
          console.error(
            "Failed to fetch company data:",
            res.status,
            await res.text()
          );
          return;
        }
        const data: CompanyDetailsData = await res.json();
        setCompanyDetails(data);
      } catch (err) {
        console.error("Error fetching company data:", err);
      } finally {
        setIsLoadingCompany(false);
      }
    }

    loadCompanyData();
  }, []);



  async function handleGenerateApplication(messages: Message[]) {

    if (!session?.user?.hasPaid) {
      const stripe = await stripePromise;
      const res = await fetch("/api/stripe/create-session", { method: "POST" });
      if (!res.ok) {
        console.error("Stripe session creation failed:", await res.text());
        return;
      }
      const { url } = await res.json();
      if (stripe && url) {
        window.location.href = url;
      }
      return; // do not proceed to generation
    }

    setChatHistory(messages);

    // call your API
    const res = await fetch("/api/generate_grant_application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        combinedText: combinedFormText,
        messages,
      }),
    });
    if (!res.ok) {
      console.error("Generate failed:", await res.text());
      return;
    }
    const { title, text } = await res.json();

    setApplicationTitle(title);
    setGeneratedApplication(text);
    nextStep();
  }



  const submitAll = async () => {

    if (!session?.user.hasPaid) {
      setSubmitting(true);
      try {
        const res = await fetch("/api/stripe/create-session", {
          method: "POST",
        });
        const { url } = await res.json();
        window.location.href = url;
      } catch (err) {
        console.error("🛑 Couldn’t start checkout:", err);
        setSubmitting(false);
      }
      return;
    }


    // setSubmitting(true);
    const payload = { ...companyDetails, ...grantDetails, ...budgetDetails };

    console.log("payload: ", payload)
    // try {
    //   const res = await fetch("/api/application", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(payload),
    //   });
    //   if (!res.ok) throw new Error(await res.text());
    // } catch (err) {
    //   console.error("🛑 Submission failed:", err);
    // } finally {
    //   setSubmitting(false);
    // }

    nextStep();
  };




  return (
    <ContentLayout title="New Grant Application">

      <div className="flex flex-col h-full px-5 min-[1340px]:px-0">

        {(!hasPersonalDetails || !hasCompanyDetails) && (
          <Banner />
        )}

        <StepTracker currentStep={currentStep} onStepClick={setCurrentStep} />

        <div className="flex-1 overflow-hidden">
          {currentStep === 1 && (
            <>
              {isLoadingCompany ? (
                <div className="h-[75vh] flex-1 flex items-center justify-center text-gray-400">
                  <Spinner />
                </div>
              ) : (
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
              isProfileComplete={hasPersonalDetails && hasCompanyDetails}
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

          {currentStep === 4 &&
            <AdditionalQuestions
              onBack={prevStep}
              onNext={handleGenerateApplication}
              companyDetails={companyDetails!} 
              grantDetails={grantDetails!}    
              budgetDetails={budgetDetails!}   
              applicationFormFile={grantDetails?.applicationFormFile ?? null}
              applicationFormLink={grantDetails?.applicationFormLink ?? ""}
              setCombinedFormText={setCombinedFormText}
            />
          }

          {currentStep === 5 && 
            <Finalise 
              applicationText={generatedApplication} 
              applicationTitle={applicationTitle} 
            />}
        </div>
      </div>
    </ContentLayout>
  );
}

