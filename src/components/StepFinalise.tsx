"use client";

import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";

export default function Finalise() {
  // 1) Your final text
  const finalText = `Here is the application content...

Line 1: Introduction to the candidate.
Line 2: Educational background.
Line 3: Work experience details.
Line 4: Skills and certifications.

Feel free to insert as many paragraphs or bullet points as you need.
Each line will auto-wrap based on the PDF page width.
Here is the application content...

Line 1: Introduction to the candidate.
Line 2: Educational background.
Line 3: Work experience details.
Line 4: Skills and certifications.

Feel free to insert as many paragraphs or bullet points as you need.
Each line will auto-wrap based on the PDF page width.
Here is the application content...

Line 1: Introduction to the candidate.
Line 2: Educational background.
Line 3: Work experience details.
Line 4: Skills and certifications.

Feel free to insert as many paragraphs or bullet points as you need.
Each line will auto-wrap based on the PDF page width.
Here is the application content...

Line 1: Introduction to the candidate.
Line 2: Educational background.
Line 3: Work experience details.
Line 4: Skills and certifications.

Feel free to insert as many paragraphs or bullet points as you need.
Each line will auto-wrap based on the PDF page width.

`;

  const [availableHeight, setAvailableHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

      // If you want a little extra vertical padding above/below:
      const extraPaddingTop = 16;   // px (e.g. for margin)
      const extraPaddingBottom = 16; // px

      const newAvailableHeight =
        window.innerHeight -
        navbarHeight -
        footerHeight -
        extraPaddingTop -
        extraPaddingBottom;

      setAvailableHeight(newAvailableHeight);
    }

    // Calculate on mount:
    calculateHeight();

    // Recalculate whenever the window resizes:
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  // 3) PDF save logic
  const saveAsPdf = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // dark background
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // margins
    const marginLeft = 40;
    const marginTop = 40;
    const usableWidth = pageWidth - marginLeft * 2;

    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);

    doc.text(finalText, marginLeft, marginTop, {
      maxWidth: usableWidth,
      align: "left",
    });

    doc.save("application.pdf");
  };

  return (
    <div className="flex flex-col h-full max-w-[960px] mx-auto w-full">

      <div
        ref={containerRef}
        className="flex flex-col w-full rounded-md border border-border bg-[#0E0E0E] overflow-hidden"
        style={{ height: availableHeight }}
      >
        {/* Header (fixed height) */}
        <div className="flex-shrink-0 flex items-center px-4 py-3 border-b border-[#1C1C1C]">
          <p className="text-[15px] font-bold text-white">Application Content</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-[15px] text-white tracking-normal">
          <pre className="whitespace-pre-wrap">{finalText}</pre>
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
