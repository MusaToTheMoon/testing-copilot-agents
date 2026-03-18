"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Sidebar } from "@/components/layout/Sidebar";
import type { EssayType, CitationStyle, ToneType } from "@essay-app/types";

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    prompt: "",
    essayType: "argumentative" as EssayType,
    targetWordCount: 1500,
    citationStyle: "APA" as CitationStyle,
    tone: "academic" as ToneType,
    formalityLevel: 3,
    dueDate: "",
    rubric: "",
  });

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value =
        field === "targetWordCount" || field === "formalityLevel"
          ? parseInt(e.target.value, 10)
          : e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await createProject({
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        rubric: formData.rubric || undefined,
      });
      if (result.data) {
        router.push(`/projects/${result.data.id}/research`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">New Essay Project</h1>
          <p className="text-gray-500 mb-8">Set up your essay parameters to get started.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
              <Input
                label="Essay Title"
                value={formData.title}
                onChange={handleChange("title")}
                placeholder="e.g., The Impact of AI on Higher Education"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Essay Prompt / Topic
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={handleChange("prompt")}
                  placeholder="Enter your essay prompt or topic description..."
                  rows={4}
                  required
                  minLength={10}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Essay Type"
                  value={formData.essayType}
                  onChange={handleChange("essayType")}
                  options={[
                    { value: "argumentative", label: "Argumentative" },
                    { value: "analytical", label: "Analytical" },
                    { value: "compare_contrast", label: "Compare & Contrast" },
                    { value: "literature_review", label: "Literature Review" },
                    { value: "reflection", label: "Reflection" },
                    { value: "research_essay", label: "Research Essay" },
                  ]}
                />

                <Input
                  label="Target Word Count"
                  type="number"
                  value={formData.targetWordCount}
                  onChange={handleChange("targetWordCount")}
                  min={100}
                  max={50000}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Citation Style"
                  value={formData.citationStyle}
                  onChange={handleChange("citationStyle")}
                  options={[
                    { value: "APA", label: "APA" },
                    { value: "MLA", label: "MLA" },
                    { value: "Chicago", label: "Chicago" },
                    { value: "Harvard", label: "Harvard" },
                    { value: "IEEE", label: "IEEE" },
                  ]}
                />

                <Select
                  label="Tone"
                  value={formData.tone}
                  onChange={handleChange("tone")}
                  options={[
                    { value: "academic", label: "Academic" },
                    { value: "persuasive", label: "Persuasive" },
                    { value: "formal", label: "Formal" },
                    { value: "neutral", label: "Neutral" },
                    { value: "reflective", label: "Reflective" },
                  ]}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formality Level ({formData.formalityLevel}/5)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={formData.formalityLevel}
                    onChange={handleChange("formalityLevel")}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Informal</span>
                    <span>Very Formal</span>
                  </div>
                </div>

                <Input
                  label="Due Date (optional)"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange("dueDate")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rubric / Instructions (optional)
                </label>
                <textarea
                  value={formData.rubric}
                  onChange={handleChange("rubric")}
                  placeholder="Paste your rubric or any specific instructions here..."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" size="lg" isLoading={isLoading}>
                  Create Project & Start Research
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
