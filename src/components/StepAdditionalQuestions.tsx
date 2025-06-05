// components/StepAdditionalQuestions.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GrantDetailsData } from "./StepGrantDetails";
import { BudgetDetailsData } from "./StepBudget";
import { CompanyDetailsData } from "./StepCompanyDetails";

const generateUUID = () => crypto.randomUUID();

interface AdditionalQuestionsProps {
  onNext: () => void;
  onBack: () => void;
  applicationFormFile: File | null;
  applicationFormLink: string;
  companyDetails: CompanyDetailsData; // <- this cannot be undefined
  grantDetails: GrantDetailsData;
  budgetDetails: BudgetDetailsData;

}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AdditionalQuestions({
  onNext,
  onBack,
  companyDetails,
  grantDetails,
  budgetDetails,
  applicationFormFile,
  applicationFormLink,
}: AdditionalQuestionsProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [canType, setCanType] = useState(false);
  const [canFinalize, setCanFinalize] = useState(false);
  const [input, setInput] = useState("");

  const [systemPrompt, setSystemPrompt] = useState<string>("");


  const streamMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    // If neither a file nor link was provided, show an error bubble and never enable typing
    if (!applicationFormFile && !applicationFormLink.trim()) {
      const id = generateUUID();
      setMessages([{ id, role: "assistant", content: "No application form provided." }]);
      setCanType(false);
      return;
    }

    async function fetchInitialQuestion() {
      // 1) Create a brand‐new assistant message in state with empty content
      const assistantId = generateUUID();
      streamMsgIdRef.current = assistantId;
      setMessages([{ id: assistantId, role: "assistant", content: "" }]);

      // 2) Build FormData exactly as our backend expects (file or link + empty messages array)
      const form = new FormData();

      form.append("company_name", companyDetails.company_name);
      form.append("website_url", companyDetails.website_url);
      form.append("country", companyDetails.country);
      form.append("company_background", companyDetails.company_background);
      form.append("product", companyDetails.product);
      form.append(
        "competitors_unique_value_proposition",
        companyDetails.competitors_unique_value_proposition
      );
      form.append("current_stage", companyDetails.current_stage);
      form.append("main_objective", companyDetails.main_objective);
      form.append("target_customers", companyDetails.target_customers);
      form.append("funding_status", companyDetails.funding_status);

      if (Array.isArray(companyDetails.attachments)) {
        companyDetails.attachments.forEach((att, idx) => {
          if (att instanceof File) {
            // By this point, there shouldn’t be any raw File objects.
            // If you do have a File, you can either skip or handle it here.
            return;
          }
          // att is now { name: string; url: string; key: string }
          form.append(`companyAttachmentUrl_${idx}`, att.url);
        });
      }

      if (applicationFormFile) {
        form.append("applicationFormFile", applicationFormFile);
      } else {
        form.append("applicationFormLink", applicationFormLink.trim());
      }

      form.append("grant_link", grantDetails.grantLink);
      form.append("amount_applying_for", grantDetails.amountApplyingFor);

      form.append("allocation_details", budgetDetails.allocationDetails);

      form.append("messages", JSON.stringify([]));

      // 3) Kick off the fetch to our streaming endpoint
      const res = await fetch("/api/extract_questions", {
        method: "POST",
        body: form,
      });

      if (!res.ok || !res.body) {
        // If streaming fails, replace the assistant message with an error
        const errorText = await res.text();
        if (!isCancelled) {
          setMessages([
            {
              id: assistantId,
              role: "assistant",
              content: `❌ Failed to load first question (${res.status}): ${errorText}`,
            },
          ]);
          setCanType(false);
        }
        return;
      }

      // 4) Obtain a reader from the response body, and decode chunk by chunk
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done && !isCancelled) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value && !isCancelled) {
          const chunkText = decoder.decode(value);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + chunkText }
                : m
            )
          );
        }
      }

      // 5) Once streaming has finished, enable the user input
      if (!isCancelled) {
        setCanType(true);
      }
    }

    fetchInitialQuestion();
    return () => {
      isCancelled = true;
    };
  }, [companyDetails, grantDetails, budgetDetails, applicationFormFile, applicationFormLink]);

  const handleSend = async () => {
    if (!canType || !input.trim()) return;

    // Append the user's new message
    const newUserMsg: Message = {
      id: generateUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setCanType(false); // disable input until next question finishes streaming

    const form = new FormData();

    form.append("company_name", companyDetails.company_name);
    form.append("website_url", companyDetails.website_url);
    form.append("country", companyDetails.country);
    form.append("company_background", companyDetails.company_background);
    form.append("product", companyDetails.product);
    form.append(
      "competitors_unique_value_proposition",
      companyDetails.competitors_unique_value_proposition
    );
    form.append("current_stage", companyDetails.current_stage);
    form.append("main_objective", companyDetails.main_objective);
    form.append("target_customers", companyDetails.target_customers);
    form.append("funding_status", companyDetails.funding_status);

    if (Array.isArray(companyDetails.attachments)) {
      companyDetails.attachments.forEach((att, idx) => {
        if (att instanceof File) {
          // By this point, there shouldn’t be any raw File objects.
          // If you do have a File, you can either skip or handle it here.
          return;
        }
        // att is now { name: string; url: string; key: string }
        form.append(`companyAttachmentUrl_${idx}`, att.url);
      });
    }

    if (applicationFormFile) {
      form.append("applicationFormFile", applicationFormFile);
    } else {
      form.append("applicationFormLink", applicationFormLink.trim());
    }

    form.append("grant_link", grantDetails.grantLink);
    form.append("amount_applying_for", grantDetails.amountApplyingFor);

    form.append("allocation_details", budgetDetails.allocationDetails);

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
      newUserMsg,
    ];
    form.append("messages", JSON.stringify(fullMessages));

    // // Build a JSON payload with ALL messages so far (assistant + user)
    // const payload = {
    //   messages: messages
    //     .concat(newUserMsg) // include this new answer
    //     .map((m) => ({
    //       role: m.role,
    //       content: m.content,
    //     })),
    //   // No need to re‐send file or link after the first request
    //   applicationFormLink: "",
    // };

    // const res = await fetch("/api/extract_questions", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });

    const res = await fetch("/api/extract_questions", {
      method: "POST",
      body: form,
    });

    if (!res.ok || !res.body) {
      const errorText = await res.text();
      const assistantError: Message = {
        id: generateUUID(),
        role: "assistant",
        content: `❌ Failed to load next question (${res.status}): ${errorText}`,
      };
      setMessages((prev) => [...prev, assistantError]);
      return;
    }

    const assistantId = generateUUID();
    streamMsgIdRef.current = assistantId;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    // Stream the assistant’s reply (either one question or NO_MORE_QUESTIONS)
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let fullAssistantText = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value);
        fullAssistantText += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + chunk }
              : m
          )
        );
      }
    }

    // Once streaming finishes, check for the “no more questions” token
    if (fullAssistantText.trim().startsWith("### NO_MORE_QUESTIONS")) {
      // Replace that token with a friendly “we're done” message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
              ...m,
              content:
                "🎉 All questions answered! You can now click “Finalise.”",
            }
            : m
        )
      );
      setCanFinalize(true);
      setCanType(false);
    } else {
      // We got a real next question—re-enable input
      setCanType(true);
    }
  };





  const handleGenerateApplication = async () => {
    // if (!session || !session.user) {
    //   setError("You must be logged in to generate an application.");
    //   return;
    // }

    // setError(null);
    // setIsGenerating(true);
    // setDownloadUrl(null);

    // try {
    //   // A) Build a simple PDF “in memory”
    //   const doc = new jsPDF("p", "pt", "a4");
    //   const pageWidth = doc.internal.pageSize.getWidth();
    //   const pageHeight = doc.internal.pageSize.getHeight();

    //   // 1) Fill background dark (#0F0F0F) and white text (11pt, line‐height 1.3)
    //   doc.setFillColor(15, 15, 15);
    //   doc.rect(0, 0, pageWidth, pageHeight, "F");

    //   const marginLeft = 40;
    //   const marginTop = 40;
    //   const usableWidth = pageWidth - marginLeft * 2;

    //   doc.setFontSize(11);
    //   doc.setLineHeightFactor(1.3);
    //   doc.setTextColor(255, 255, 255);

    //   // 2) Insert whatever “sample” content you like. Here, we’ll stitch together
    //   //    company + grant + budget info into a simple blob of text. You can replace
    //   //    this with the real output from your AI chat once you finalize that flow.
    //   const sampleText = `
    //   Grant Application
    //   -----------------
    //   Company Name: ${companyDetails.company_name}
    //   Website: ${companyDetails.website_url}
    //   Country: ${companyDetails.country}

    //   Grant Link: ${grantDetails.grantLink}
    //   Amount Requested: ${grantDetails.amountApplyingFor}

    //   Budget Allocation:
    //   ${budgetDetails.allocationDetails}

    //   “This is your sample application. Replace this text with the real generated content.”
    //   `;

    //   doc.text(sampleText.trim(), marginLeft, marginTop, {
    //     maxWidth: usableWidth,
    //     align: "left",
    //   });

    //   // 3) Export the PDF as a data URI (Base64)
    //   const dataUriString = doc.output("datauristring") as string;
    //   //    It will look like: "data:application/pdf;base64,JVBERi0xLj…"

    //   // 4) Fire off a fetch to our new API route
    //   //    We send the full dataUriString + a “name” for the grant.
    //   const resp = await fetch("/api/generate-application", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       file: dataUriString,
    //       // Use a human‐readable name (for example, the grant link or some label).
    //       // Your Prisma model requires a “name” and a “date.” We’ll set date = now()
    //       // on the server side, so here we only send “name.”
    //       name: `Grant for ${companyDetails.company_name}`,
    //     }),
    //   });

    //   const json = await resp.json();
    //   if (!resp.ok || !json.success) {
    //     throw new Error(json.error || "Failed to save application.");
    //   }

    //   // 5) We now have json.grant.pdfUrl (the public S3 URL). Save it in state.
    //   setDownloadUrl(json.grant.pdfUrl);

    //   // 6) Optionally navigate forward or show a success message
    //   //    Here, we’ll immediately call onNext() so the parent can move to step 4.
    //   onNext();
    // } catch (e: any) {
    //   console.error("Error generating or uploading PDF:", e);
    //   setError(e.message || "Unknown error");
    // } finally {
    //   setIsGenerating(false);
    // }
  };




  //
  // ─── DYNAMIC HEIGHT CALCULATION FOR CHAT CONTAINER ─────────────────────────────────
  //
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [chatHeight, setChatHeight] = useState<number>(0);

  useEffect(() => {
    function calculateChatHeight() {
      if (!chatContainerRef.current || !footerRef.current) {
        return;
      }

      // 1) How far down the page does the chat container start?
      const topOffset =
        chatContainerRef.current.getBoundingClientRect().top;

      // 2) How tall is the footer (Back + Finalise row)?
      const footerHeight =
        footerRef.current.getBoundingClientRect().height;

      // 3) Subtract from the viewport height:
      //    available = window.innerHeight − topOffset − footerHeight − anyExtraMargin
      const extraBottomMargin = 0; // e.g. if you want extra padding below
      const available = window.innerHeight - topOffset - footerHeight - extraBottomMargin;

      setChatHeight(available);
    }

    // Calculate immediately on mount
    calculateChatHeight();

    // Recalculate on resize
    window.addEventListener("resize", calculateChatHeight);
    return () => {
      window.removeEventListener("resize", calculateChatHeight);
    };
  }, []);

  return (
    // 1) Top-level flex-col that fills its parent, hiding overflow
    <div className="flex flex-col h-full overflow-hidden">
      {/* 
        2) Chat container (fixed to fill space between header & footer):
           - flex-1 so it takes all available space above the footer
           - flex flex-col to stack header, messages, input
           - overflow-hidden prevents expansion beyond its box
      */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 
        {/* <div className="flex-1 flex flex-col mx-auto w-full max-w-[960px] rounded-md border border-border bg-[#0E0E0E]"> */}
        <div
          ref={chatContainerRef}
          className="flex flex-col mx-auto w-full max-w-[960px] rounded-md border border-border bg-[#0E0E0E] overflow-hidden"
          style={{ height: chatHeight }}
        >
          {/* Header (fixed height) */}
          <div className="flex items-center border-b border-[#1C1C1C]">
            <p className="text-[15px] font-bold text-white p-4">
              Chat with AI Grant Writer
            </p>
          </div>

          {/*
            4) Messages pane:
               - flex-1: fills space between header & input
               - overflow-y-auto: scrolls when messages overflow
               - spacing/padding around messages
          */}
          <div className="flex-1 overflow-y-auto py-5 px-4 space-y-4 text-[15px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
              >
                <div
                  className={`p-4 rounded-lg max-w-[80%] ${msg.role === "assistant"
                    ? "bg-[#0E0E0E] border border-[#1C1C1C] text-gray-200 font-medium"
                    : "bg-[#121212] border border-[#1d1d1d] text-white font-medium"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input bar (fixed height) */}
          <div className="flex items-center p-4 border-t border-[#191919]">
            <input
              type="text"
              placeholder="Start typing there..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={!canType}
              className={`
                flex-1 h-10 
                ${canType ? "bg-transparent text-white" : "bg-transparent text-gray-500"} 
                px-4 py-2 rounded-md text-[15px] font-medium focus:outline-none border-none
                ${canType ? "" : " opacity-70"}
              `}
            />
            <button
              onClick={handleSend}
              disabled={!canType}
              className={`
                ml-3 size-10 flex items-center justify-center rounded-md 
                ${canType
                  ? "bg-[#68FCF2] text-white cursor-pointer"
                  : "bg-[#2a2a2a] opacity-60"}
                `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke={canType ? "black" : "#555555"}
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 
        5) Footer: “Back” + “Finalise” buttons
           Because parent is flex-col h-full, this sticks to bottom.
      */}
      <div className="bg-[#0F0F0F]/80 backdrop-blur-xs pt-4 pb-6 md:pb-8">
        <div className="max-w-[960px] mx-auto flex justify-between gap-4">
          <Button
            variant="outline"
            className="flex-1 h-10 font-black text-white bg-[#0E0E0E] hover:bg-[#101010] border border-[#1C1C1C] hover:text-white"
            onClick={onBack}
            type="button"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={!canFinalize}
            className={`
              flex-1 h-10 font-black text-black 
              ${canFinalize
                ? "bg-[#68FCF2] hover:bg-[#68FCF2]/80 cursor-pointer"
                : "bg-[#3a3a3a] cursor-not-allowed opacity-60"}
            `}
          >
            Finalise
          </Button>
        </div>
      </div>
    </div>
  );
}
