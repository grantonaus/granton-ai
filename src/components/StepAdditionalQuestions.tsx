// components/StepAdditionalQuestions.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GrantDetailsData } from "./StepGrantDetails";
import { BudgetDetailsData } from "./StepBudget";
import { CompanyDetailsData } from "./StepCompanyDetails";
import Spinner from "./Spinner";
import { Loader } from "./Loader";

const generateUUID = () => crypto.randomUUID();

interface AdditionalQuestionsProps {
  onNext: (messages: Message[]) => void;
  onBack: () => void;
  applicationFormFile: File | null;
  applicationFormLink: string;
  companyDetails: CompanyDetailsData; // <- this cannot be undefined
  grantDetails: GrantDetailsData;
  budgetDetails: BudgetDetailsData;
  setCombinedFormText: (text: string) => void;

}

export interface Message {
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
  setCombinedFormText,
}: AdditionalQuestionsProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [input, setInput] = useState("");
  const [canType, setCanType] = useState(false);
  const [canFinalize, setCanFinalize] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [chatHeight, setChatHeight] = useState(0);

  const [availableHeight, setAvailableHeight] = useState(0);

  const [isGenerating, setIsGenerating] = useState(false);


  // Fetch questions once
  useEffect(() => {
    let cancelled = false;

    async function fetchQuestions() {
      setIsLoading(true);
      setLoadError(null);
      try {

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
              return;
            }
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


        const res = await fetch("/api/extract_questions", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());

        const json = await res.json();
        if (!Array.isArray(json.questions) || typeof json.combinedFormText !== "string") {
          throw new Error("Unexpected API response format");
        }

        if (!cancelled) {
          // setQuestions(json.questions);
          // setCombinedFormText(json.combinedFormText);
          // typeOut(questions[0], 1);

          // 1) stash it locally
          const fetchedQs = json.questions;

          // 2) update state
          setQuestions(fetchedQs);
          setCombinedFormText(json.combinedFormText);
          setCurrentQuestionIdx(0);

          // 3) type out the very first one
          streamQuestion(0, fetchedQs[0]);
        }
      } catch (err: any) {
        setLoadError(err.message || "Failed to load questions");
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();

    return () => {
      cancelled = true;
    };
  }, [companyDetails, grantDetails, budgetDetails, applicationFormFile, applicationFormLink, setCombinedFormText]);


  // useEffect(() => {
  //   const sampleQs = [
  //     "What is your project’s timeline?",
  //     "What are your expected start and end dates?",
  //     "How will you measure success or track outcomes?",
  //   ];

  //   // give the UI a moment before starting
  //   setTimeout(() => {
  //     setQuestions(sampleQs);
  //     streamQuestion(0, sampleQs[0]);
  //     setIsLoading(false);
  //   }, 200);
  // }, []);


  const streamQuestion = (idx: number, text: string) => {
    setCanType(false);
    setCanFinalize(false);

    // 1-based numbering + prefix
    const numbered = `${idx + 1}. ${text}`;

    const id = generateUUID();
    // Insert a blank assistant bubble
    setMessages((m) => [...m, { id, role: "assistant", content: "" }]);

    let i = 0;
    // small delay for realism
    setTimeout(() => {
      const iv = setInterval(() => {
        // stop once we've typed everything
        if (i >= numbered.length) {
          clearInterval(iv);
          setCanType(true);
          return;
        }
        // append next character safely
        const char = numbered.charAt(i);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === id ? { ...msg, content: msg.content + char } : msg
          )
        );
        i++;
      }, 30);
    }, 300);
  };



  const typeOut = (text: string, number: number) => {
    setCanType(false);
    setCanFinalize(false);

    const full = `${number}. ${text}`;
    const id = generateUUID();
    setMessages(m => [...m, { id, role: "assistant", content: "" }]);

    let i = 0;
    const iv = setInterval(() => {
      if (i >= full.length) {
        clearInterval(iv);
        setCanType(true);
        return;
      }
      const char = full.charAt(i);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === id ? { ...msg, content: msg.content + char } : msg
        )
      );
      i++;
    }, 30);
  };



  // auto-scroll on new message
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    // only auto-scroll if within 100px of the bottom already
    if (distanceFromBottom < 100) {
      el.scrollTop = scrollHeight;
    }
  }, [messages]);



  // calculate chat height
  useEffect(() => {
    function calculateHeight() {

      const navbarElem = document.getElementById("navbar");
      const footerElem = document.getElementById("footer");

      const navbarHeight = navbarElem
        ? navbarElem.getBoundingClientRect().height
        : 0;
      const footerHeight = footerElem
        ? footerElem.getBoundingClientRect().height
        : 0;

      const extraPaddingTop = 16;
      const extraPaddingBottom = 16;

      const newAvailableHeight =
        window.innerHeight -
        navbarHeight -
        footerHeight -
        extraPaddingTop -
        extraPaddingBottom;

      setAvailableHeight(newAvailableHeight);
    }

    calculateHeight();

    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);




  // 4) Helper to “type” each question
  const simulateAssistantTyping = (text: string, number: number) => {
    // const raw = questions[idx] || "";
    // const text = `${idx + 1}. ${raw}`; // prefix with number

    // setCanType(false);
    // setCanFinalize(false);

    // const id = generateUUID();
    // setMessages(m => [...m, { id, role: "assistant", content: "" }]);

    // let i = 0;
    // const iv = setInterval(() => {
    //   // 1) If we've printed *all* characters, stop:
    //   if (i >= text.length) {
    //     clearInterval(iv);
    //     setCanType(true);
    //     return;
    //   }
    //   // 2) Otherwise append the *current* character:
    //   const char = text.charAt(i);
    //   setMessages(prev =>
    //     prev.map(msg =>
    //       msg.id === id
    //         ? { ...msg, content: msg.content + char }
    //         : msg
    //     )
    //   );
    //   i++;
    // }, 30);



    setCanType(false);
    setCanFinalize(false);

    const id = generateUUID();
    setMessages((m) => [...m, { id, role: "assistant", content: "" }]);

    let i = 0;
    const iv = setInterval(() => {
      if (i === text.length) {
        clearInterval(iv);
        setCanType(true);
        return;
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id
            ? { ...msg, content: msg.content + text[i] }
            : msg
        )
      );
      i++;
    }, 20);
  };


  const handleNext = () => {
    if (!input.trim()) return;

    // record user
    const userMsg: Message = {
      id: generateUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setCanType(false);

    // next question?
    const next = currentQuestionIdx + 1;
    setCurrentQuestionIdx(next);
    if (next < questions.length) {
      streamQuestion(next, questions[next]);
    } else {
      setCanFinalize(true);
    }
  };

  if (isLoading) return <div className="w-full h-full flex items-center justify-center"><Spinner /></div>;
  // if (loadError) return <div className="flex-1 flex flex-col items-center justify-center p-4"><p className="text-red-500">Error: {loadError}</p><Button onClick={onBack}>Back</Button></div>;





  return (
    <div className="flex flex-col h-full overflow-hidden">

      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          ref={chatContainerRef}
          className="flex flex-col mx-auto w-full max-w-[960px] rounded-md border border-border bg-[#0E0E0E] overflow-hidden"
          style={{ height: availableHeight }}
        >
          {/* Header (fixed height) */}
          <div className="flex items-center border-b border-[#1C1C1C]">
            <p className="text-[15px] font-bold text-white p-4">
              Chat with AI Grant Writer
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-5 px-4 space-y-4 text-[15px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
              >
                <div
                  className={`p-4 rounded-lg max-w-[80%] ${msg.role === "assistant"
                    ? "bg-[#0E0E0E] border border-[#1C1C1C] text-gray-200"
                    : "bg-[#121212] border border-[#1d1d1d] text-white"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center p-4 border-t border-[#191919]">
            <input
              type="text"
              placeholder="Start typing there..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              // onKeyDown={(e) => e.key === "Enter" && handleSend()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleNext();
                }
              }}
              disabled={!canType}
              className={`
                flex-1 h-10 
                ${canType ? "bg-transparent text-white" : "bg-transparent text-gray-500"} 
                px-4 py-2 rounded-md text-[15px] font-medium focus:outline-none border-none
                ${canType ? "" : " opacity-70"}
              `}
            />
            <button
              // onClick={handleSend}
              onClick={handleNext}
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
      <div ref={footerRef} className="bg-[#0F0F0F]/80 backdrop-blur-xs pt-4 pb-6 md:pb-8">
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
            onClick={async () => {
              setIsGenerating(true);
              await onNext(messages);
              setIsGenerating(false);
            }}
            disabled={!canFinalize}
            className={`
              flex-1 h-10 font-black text-black 
              ${canFinalize
                ? "bg-[#68FCF2] hover:bg-[#68FCF2]/80 cursor-pointer"
                : "bg-[#3a3a3a] cursor-not-allowed opacity-60"}
            `}
          >
            <Loader loading={isGenerating}>Finalise</Loader>
          </Button>
        </div>
      </div>
    </div>
  );

}
