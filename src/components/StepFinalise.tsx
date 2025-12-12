
"use client";

import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/user";
import { isUserPremium } from "@/app/actions/premium";
import UpgradePrompt from "@/components/UpgradePrompt";

interface FinaliseProps {
  applicationText: string;
  applicationTitle: string;
}

// Helper to generate a PDF with consistent margins, dark background, and pagination
function generatePdf(doc: jsPDF, text: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;               // top, bottom, left & right
  const fontSize = 11;
  const lineHeightF = 1.5;
  const usableWidth = pageWidth - margin * 2;
  const lineHeight = fontSize * lineHeightF;

  doc.setFontSize(fontSize);
  doc.setTextColor(255, 255, 255);

  const paintBg = () => {
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setTextColor(255, 255, 255);
  };

  paintBg();

  const lines = doc.splitTextToSize(text, usableWidth);
  let y = margin;
  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      paintBg();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }
}

export default function Finalise({ applicationText, applicationTitle }: FinaliseProps) {
  const { session } = useCurrentUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const didUploadRef = useRef(false);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.user?.id) {
        setIsPaid(false);
        setIsChecking(false);
        return;
      }
      try {
        const result = await isUserPremium();
        setIsPaid(result.subscribed);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setIsPaid(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkSubscription();
  }, [session]);

  const paragraphs = applicationText
    .split(/\n\s*\n/)     // split on blank lines
    .map((p) => p.trim())
    .filter(Boolean);

  const PREVIEW_COUNT = 4; // show first 4 paragraphs un-blurred
  const previewParas = paragraphs.slice(0, PREVIEW_COUNT).join("\n\n");
  const restParas = paragraphs.slice(PREVIEW_COUNT).join("\n\n");


  useEffect(() => {
    if (
      didUploadRef.current ||
      !applicationText.trim() ||
      !session?.user?.id
    ) return;

    didUploadRef.current = true;
    setIsSaving(true);

    (async () => {
      try {
        // generate PDF
        const doc = new jsPDF("p", "pt", "a4");
        generatePdf(doc, applicationText);
        const pdfBlob = doc.output("blob");
        setDownloadUrl(URL.createObjectURL(pdfBlob));


        if (isPaid) {
          // presign & upload
          const safeName = applicationTitle.replace(/\s+/g, "_").slice(0, 50);
          const fileName = `${safeName}_${session.user.id}_${Date.now()}.pdf`;
          const presignRes = await fetch(
            `/api/s3-upload-url?fileName=${encodeURIComponent(fileName)}&userId=${session.user.id}`
          );
          if (!presignRes.ok) throw new Error("Failed to get upload URL");
          const { uploadUrl, key } = await presignRes.json();

          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: pdfBlob,
            headers: { "Content-Type": "application/pdf" },
          });
          if (!uploadRes.ok) throw new Error("Failed to upload PDF");

          const pdfUrl =
            `https://company-attachments-bucket.s3.eu-north-1.amazonaws.com/${encodeURIComponent(
              key
            )}`;

          // record in DB
          const createRes = await fetch("/api/applications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: applicationTitle,
              date: new Date().toISOString(),
              pdfUrl,
            }),
          });
          if (!createRes.ok) {
            const txt = await createRes.text();
            throw new Error("DB save failed: " + txt);
          }
        }

        setIsSaved(true);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Unknown error");
      } finally {
        setIsSaving(false);
      }
    })();
  }, [applicationText, applicationTitle, session, isPaid]);


  const saveAsPdf = () => {
    const doc = new jsPDF("p", "pt", "a4");
    generatePdf(doc, applicationText);
    doc.save("application.pdf");
  };

  // Show loading state while checking subscription
  if (isChecking) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] max-w-[1200px] mx-auto w-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If not subscribed, show upgrade prompt instead of application
  if (!isPaid) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] max-w-[1200px] mx-auto w-full">
        <UpgradePrompt
          title="Upgrade to View Your Application"
          description="Subscribe to Pro to view and save your generated grant application"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-[1200px] mx-auto w-full">
      <div
        className="flex flex-col flex-1 w-full rounded-md border border-border bg-[#0E0E0E] overflow-hidden min-h-0"
      >
        <div className="flex-shrink-0 flex items-center px-4 py-3 border-b border-[#1C1C1C]">
          <p className="text-[15px] font-bold text-white">Application Content</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-[15px] text-white tracking-normal min-h-0">
          <pre className="whitespace-pre-wrap">{applicationText}</pre>
        </div>
      </div>

      <div className="flex-shrink-0 pt-4 pb-8">
        <Button
          type="button"
          className="w-full h-10 font-black text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 cursor-pointer"
          onClick={saveAsPdf}
        >
          Save as PDF
        </Button>
      </div>
    </div>
  );
}