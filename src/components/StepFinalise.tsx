// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import jsPDF from "jspdf";
// import { Button } from "@/components/ui/button";
// import { useCurrentUser } from "@/hooks/user";

// interface FinaliseProps {
//   applicationText: string;
//   applicationTitle: string;
// }

// export default function Finalise({ applicationText, applicationTitle }: FinaliseProps) {
//   const containerRef = useRef<HTMLDivElement>(null);  // ← add this
//   const [availableHeight, setAvailableHeight] = useState(0);
//   const { session } = useCurrentUser();
//   const [isSaving, setIsSaving] = useState(false);
//   const [isSaved, setIsSaved] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
//   const didUploadRef = useRef(false);

//   useEffect(() => {
//     if (
//       didUploadRef.current ||
//       !applicationText.trim() ||
//       !session?.user?.id
//     )
//       return;
//     didUploadRef.current = true;
//     setIsSaving(true);

//     (async () => {
//       try {
//         // generate PDF
//         const doc = new jsPDF("p", "pt", "a4");
//         const { width, height } = doc.internal.pageSize;
//         doc.setFillColor(15, 15, 15);
//         doc.rect(0, 0, width, height, "F");
//         const margin = 40;
//         doc.setFontSize(11);
//         doc.setTextColor(255, 255, 255);
//         doc.text(applicationText, margin, margin, {
//           maxWidth: width - margin * 2,
//           lineHeightFactor: 1.5,
//         });
//         const pdfBlob = doc.output("blob");
//         setDownloadUrl(URL.createObjectURL(pdfBlob));

//         // presign & upload
//         const safeName = applicationTitle
//           .replace(/\s+/g, "_")
//           .slice(0, 50);
//         const fileName = `${safeName}_${session.user.id}_${Date.now()}.pdf`;
//         const presignRes = await fetch(
//           `/api/s3-upload-url?fileName=${encodeURIComponent(
//             fileName
//           )}&userId=${session.user.id}`
//         );
//         if (!presignRes.ok)
//           throw new Error("Failed to get upload URL");
//         const { uploadUrl, key } = await presignRes.json();

//         const uploadRes = await fetch(uploadUrl, {
//           method: "PUT",
//           body: pdfBlob,
//           headers: { "Content-Type": "application/pdf" },
//         });
//         if (!uploadRes.ok)
//           throw new Error("Failed to upload PDF");
//         const pdfUrl = `https://company-attachments-bucket.s3.eu-north-1.amazonaws.com/${encodeURIComponent(
//           key
//         )}`;

//         // record in DB
//         const createRes = await fetch("/api/applications", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             name: applicationTitle,
//             date: new Date().toISOString(),
//             pdfUrl,
//           }),
//         });
//         if (!createRes.ok) {
//           const txt = await createRes.text();
//           throw new Error("DB save failed: " + txt);
//         }
//         setIsSaved(true);
//       } catch (e: any) {
//         console.error(e);
//         setError(e.message || "Unknown error");
//       } finally {
//         setIsSaving(false);
//       }
//     })();
//   }, [applicationText, applicationTitle, session]);





//   useEffect(() => {
//     function calculateHeight() {

//       const navbarElem = document.getElementById("navbar");
//       const footerElem = document.getElementById("footer");

//       const navbarHeight = navbarElem
//         ? navbarElem.getBoundingClientRect().height
//         : 0;
//       const footerHeight = footerElem
//         ? footerElem.getBoundingClientRect().height
//         : 0;

//       const extraPaddingTop = 16;
//       const extraPaddingBottom = 16;

//       const newAvailableHeight =
//         window.innerHeight -
//         navbarHeight -
//         footerHeight -
//         extraPaddingTop -
//         extraPaddingBottom;

//       setAvailableHeight(newAvailableHeight);
//     }

//     calculateHeight();

//     window.addEventListener("resize", calculateHeight);
//     return () => window.removeEventListener("resize", calculateHeight);
//   }, []);

//   // const saveAsPdf = () => {
//   //   const doc = new jsPDF("p", "pt", "a4");
//   //   const pageWidth = doc.internal.pageSize.getWidth();
//   //   const pageHeight = doc.internal.pageSize.getHeight();

//   //   // dark background
//   //   doc.setFillColor(15, 15, 15);
//   //   doc.rect(0, 0, pageWidth, pageHeight, "F");

//   //   // margins
//   //   const marginLeft = 40;
//   //   const marginTop = 40;
//   //   const usableWidth = pageWidth - marginLeft * 2;

//   //   doc.setFontSize(11);
//   //   doc.setTextColor(255, 255, 255);

//   //   doc.text(finalText, marginLeft, marginTop, {
//   //     maxWidth: usableWidth,
//   //     align: "left",
//   //   });

//   //   doc.save("application.pdf");
//   // };


//   const saveAsPdf = () => {
//     const doc = new jsPDF("p", "pt", "a4");
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();

//     // dark background
//     doc.setFillColor(15, 15, 15);
//     doc.rect(0, 0, pageWidth, pageHeight, "F");

//     // margins
//     const marginLeft = 40;
//     const marginTop = 40;
//     const usableWidth = pageWidth - marginLeft * 2;

//     doc.setFontSize(11);
//     doc.setTextColor(255, 255, 255);

//     doc.text(applicationText, marginLeft, marginTop, {
//       maxWidth: usableWidth,
//       align: "left",
//       lineHeightFactor: 1.5,
//     });

//     doc.save("application.pdf");
//   };

//   return (
//     <div className="flex flex-col h-full max-w-[960px] mx-auto w-full">

//       <div
//         ref={containerRef}
//         className="flex flex-col w-full rounded-md border border-border bg-[#0E0E0E] overflow-hidden"
//         style={{ height: availableHeight }}
//       >
//         <div className="flex-shrink-0 flex items-center px-4 py-3 border-b border-[#1C1C1C]">
//           <p className="text-[15px] font-bold text-white">Application Content</p>
//         </div>

//         <div className="flex-1 overflow-y-auto p-4 text-[15px] text-white tracking-normal">
//           {/* <pre className="whitespace-pre-wrap">{finalText}</pre> */}
//           <pre className="whitespace-pre-wrap">{applicationText}</pre>
//         </div>
//       </div>

//       <div className="flex-shrink-0 pt-2 pb-8">
//         <Button
//           type="button"
//           className="w-full h-10 font-black text-black bg-[#68FCF2] hover:bg-[#68FCF2]/80 cursor-pointer"
//           onClick={saveAsPdf}
//         >
//           Save as PDF
//         </Button>
//       </div>
//     </div>
//   );
// }



"use client";

import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/user";

interface FinaliseProps {
  applicationText: string;
  applicationTitle: string;
}

// Helper to generate a PDF with consistent margins, dark background, and pagination
function generatePdf(doc: jsPDF, text: string) {
  const pageWidth   = doc.internal.pageSize.getWidth();
  const pageHeight  = doc.internal.pageSize.getHeight();
  const margin      = 40;               // top, bottom, left & right
  const fontSize    = 11;
  const lineHeightF = 1.5;
  const usableWidth = pageWidth - margin * 2;
  const lineHeight  = fontSize * lineHeightF;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableHeight, setAvailableHeight] = useState(0);
  const { session } = useCurrentUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const didUploadRef = useRef(false);

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

        setIsSaved(true);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Unknown error");
      } finally {
        setIsSaving(false);
      }
    })();
  }, [applicationText, applicationTitle, session]);

  useEffect(() => {
    function calculateHeight() {
      const navbarElem = document.getElementById("navbar");
      const footerElem = document.getElementById("footer");
      const navbarHeight = navbarElem ? navbarElem.getBoundingClientRect().height : 0;
      const footerHeight = footerElem ? footerElem.getBoundingClientRect().height : 0;
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

  const saveAsPdf = () => {
    const doc = new jsPDF("p", "pt", "a4");
    generatePdf(doc, applicationText);
    doc.save("application.pdf");
  };

  return (
    <div className="flex flex-col h-full max-w-[960px] mx-auto w-full">
      <div
        ref={containerRef}
        className="flex flex-col w-full rounded-md border border-border bg-[#0E0E0E] overflow-hidden"
        style={{ height: availableHeight }}
      >
        <div className="flex-shrink-0 flex items-center px-4 py-3 border-b border-[#1C1C1C]">
          <p className="text-[15px] font-bold text-white">Application Content</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-[15px] text-white tracking-normal">
          <pre className="whitespace-pre-wrap">{applicationText}</pre>
        </div>
      </div>

      <div className="flex-shrink-0 pt-2 pb-8">
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