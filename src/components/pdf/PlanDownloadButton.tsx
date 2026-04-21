"use client";

import dynamic from "next/dynamic";
import type { SavedPlan } from "@/types";
import PlanPDF from "./PlanPDF";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => <span className="text-foreground-muted text-[0.875rem]">Preparing PDF…</span> }
);

export default function PlanDownloadButton({ plan }: { plan: SavedPlan }) {
  const filename = `${plan.animeTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-plan.pdf`;

  return (
    <PDFDownloadLink document={<PlanPDF plan={plan} />} fileName={filename}>
      {({ loading }: { loading: boolean }) => (
        <button
          disabled={loading}
          className="
            w-full rounded-full border border-border
            text-foreground-muted py-3.5 text-[0.9375rem] font-semibold
            hover:text-foreground hover:border-foreground-muted
            transition-all disabled:opacity-50
          "
        >
          {loading ? "Preparing PDF…" : "Download PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
