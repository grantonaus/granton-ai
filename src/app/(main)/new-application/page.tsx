"use client";

import { useEffect, useState, useCallback } from "react";
import StepGrantDetails, { GrantDetailsData } from "@/components/StepGrantDetails";
import { StepTracker } from "@/components/Stepper";
import BudgetDetailsDetails, { BudgetDetailsData } from "@/components/StepBudget";
import AdditionalQuestions, { Message } from "@/components/StepAdditionalQuestions";
import Finalise from "@/components/StepFinalise";
import { Banner } from "@/components/Banner";
import { usePersonal } from "@/contexts/PersonalContext";
import { useCurrentUser } from "@/hooks/user";
import { processAttachments } from "@/lib/file-upload";
import type { CompanyDetailsData } from "@/components/StepCompanyDetails";
import { isUserPremium } from "@/app/actions/premium";

const MAX_STEPS = 5;
const DEFAULT_APPLICATION_TITLE = "Grant_Application";

export default function NewApplicationPage() {
  const { session } = useCurrentUser();
  const { hasPersonalDetails, hasCompanyDetails } = usePersonal();

  const [currentStep, setCurrentStep] = useState(1);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsData>();
  const [grantDetails, setGrantDetails] = useState<GrantDetailsData>();
  const [budgetDetails, setBudgetDetails] = useState<BudgetDetailsData>();
  const [aiGrantRequirements, setAiGrantRequirements] = useState<string>("");
  const [combinedFormText, setCombinedFormText] = useState<string>("");
  const [generatedApplication, setGeneratedApplication] = useState<string>("");
  const [applicationTitle, setApplicationTitle] = useState<string>(
    DEFAULT_APPLICATION_TITLE
  );
  const [isProUser, setIsProUser] = useState<boolean | null>(null);

  const nextStep = useCallback(
    () => setCurrentStep((s) => Math.min(s + 1, MAX_STEPS)),
    []
  );
  const prevStep = useCallback(
    () => setCurrentStep((s) => Math.max(s - 1, 1)),
    []
  );

  const handleCompanyNext = useCallback(
    async (data: CompanyDetailsData) => {
      if (!session?.user?.id) {
        return;
      }

      try {
        const finalAttachments = await processAttachments(data.attachments || []);

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
          competitors_unique_value_proposition:
            data.competitors_unique_value_proposition,
          current_stage: data.current_stage,
          main_objective: data.main_objective,
          target_customers: data.target_customers,
          funding_status: data.funding_status,
          attachments: finalAttachments,
        };

        const res = await fetch("/api/company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errTxt = await res.text().catch(() => "Unknown error");
          throw new Error(`Failed to save company data: ${errTxt}`);
        }

        nextStep();
      } catch (error) {
        console.error("Error processing company details:", error);
      }
    },
    [session?.user?.id, nextStep]
  );


  const handleGrantNext = useCallback(
    async (data: GrantDetailsData) => {
      setGrantDetails(data);

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
          const errorText = await res.text().catch(() => "Unknown error");
          console.error("Failed to extract grant requirements:", errorText);
          setAiGrantRequirements("");
        } else {
          const json: { aiGrantExtraction: string } = await res.json();
          setAiGrantRequirements(json.aiGrantExtraction);
        }
      } catch (error) {
        console.error("Error calling /api/ai_budget:", error);
        setAiGrantRequirements("");
      }

      nextStep();
    },
    [nextStep]
  );


  const handleBudgetNext = useCallback(
    (data: BudgetDetailsData) => {
      setBudgetDetails(data);
      nextStep();
    },
    [nextStep]
  );


  useEffect(() => {
    async function loadCompanyData() {
      try {
        const res = await fetch("/api/company", { cache: "no-cache" });
        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error("Failed to fetch company data:", res.status, errorText);
          return;
        }
        const data: CompanyDetailsData = await res.json();
        setCompanyDetails(data);
      } catch (error) {
        console.error("Error fetching company data:", error);
      }
    }

    loadCompanyData();
  }, []);

  // Check subscription status early
  useEffect(() => {
    async function checkSubscription() {
      try {
        const result = await isUserPremium();
        setIsProUser(result.subscribed);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setIsProUser(false);
      }
    }
    checkSubscription();
  }, []);



  const handleGenerateApplication = useCallback(
    async (messages: Message[]) => {
      try {
        const res = await fetch("/api/generate_grant_application", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            combinedText: combinedFormText,
            messages,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error("Failed to generate application:", errorText);
          return;
        }

        const { title, text } = await res.json();
        setApplicationTitle(title || DEFAULT_APPLICATION_TITLE);
        setGeneratedApplication(text);
        nextStep();
      } catch (error) {
        console.error("Error generating application:", error);
      }
    },
    [combinedFormText, nextStep]
  );



  const submitAll = useCallback(async () => {
    nextStep();
  }, [nextStep]);




  const showBanner = !hasPersonalDetails || !hasCompanyDetails;
  const isProfileComplete = hasPersonalDetails && hasCompanyDetails;

  return (
    <div className="mt-0 flex h-full min-h-0 w-full flex-1 flex-col overscroll-none bg-[#0F0F0F]">
      <div className="z-30 shrink-0 bg-[#0d0d0d]">
        <div
          className={`mx-auto max-w-[1400px] px-5 pb-2 lg:px-8 lg:pb-4 ${
            showBanner ? "pt-0 lg:pt-8" : "pt-0 lg:pt-0"
          }`}
        >
          {showBanner && <Banner />}
        </div>
        <div className="w-full">
          <StepTracker currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-5 lg:px-8">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {currentStep === 1 && (
            <StepGrantDetails
              defaultValues={grantDetails}
              onNext={handleGrantNext}
              onBack={prevStep}
              isProfileComplete={isProfileComplete}
            />
          )}

          {currentStep === 2 && (
            <BudgetDetailsDetails
              defaultValues={budgetDetails}
              onNext={handleBudgetNext}
              onBack={prevStep}
              grantValues={grantDetails}
              grantRequirements={aiGrantRequirements}
            />
          )}

          {currentStep === 3 && companyDetails && grantDetails && budgetDetails && (
            <AdditionalQuestions
              onBack={prevStep}
              onNext={handleGenerateApplication}
              companyDetails={companyDetails}
              grantDetails={grantDetails}
              budgetDetails={budgetDetails}
              applicationFormFile={grantDetails.applicationFormFile ?? null}
              applicationFormLink={grantDetails.applicationFormLink ?? ""}
              setCombinedFormText={setCombinedFormText}
            />
          )}

          {currentStep === 4 && (
            <Finalise
              applicationText={generatedApplication}
              applicationTitle={applicationTitle}
              isProUser={isProUser}
            />
          )}
        </div>
      </div>
    </div>
  );
}

