"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useProject } from "@/hooks/useProject";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StageNav } from "@/components/project/StageNav";
import { Button } from "@/components/ui/Button";
import { exportDocx, exportPdf } from "@/lib/api";

export default function ExportPage() {
  const params = useParams<{ id: string }>();
  const { project, isLoading, error } = useProject(params.id);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (format: "docx" | "pdf") => {
    setExporting(format);
    setExportError(null);
    try {
      if (format === "docx") {
        await exportDocx(params.id);
      } else {
        await exportPdf(params.id);
      }
      setExported(format);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header project={project} />
        {project && <StageNav projectId={params.id} currentStage={project.stage} />}

        <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {exportError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {exportError}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your essay is ready!
            </h2>
            <p className="text-gray-500 mb-8">
              {project?.title} — {project?.targetWordCount.toLocaleString()} word target
            </p>

            {exported ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                <p className="font-medium">✓ Export successful!</p>
                <p className="text-sm mt-1">
                  Your essay has been exported as {exported.toUpperCase()}.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => void handleExport("docx")}
                  isLoading={exporting === "docx"}
                >
                  📄 Export as DOCX
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => void handleExport("pdf")}
                  isLoading={exporting === "pdf"}
                >
                  📑 Export as PDF
                </Button>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Export Notes</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• DOCX exports are formatted for Microsoft Word and Google Docs</li>
              <li>• PDF exports preserve exact formatting</li>
              <li>• Citation style: {project?.citationStyle}</li>
              <li>• You can export multiple times if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
