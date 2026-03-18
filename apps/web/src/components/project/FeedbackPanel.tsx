"use client";

import { useState } from "react";
import type { FeedbackComment } from "@essay-app/types";
import { Button } from "@/components/ui/Button";
import { createComment, updateComment } from "@/lib/api";

interface FeedbackPanelProps {
  projectId: string;
  artifactType: FeedbackComment["artifactType"];
  artifactId: string;
  comments: FeedbackComment[];
  onCommentAdded?: () => void;
}

export function FeedbackPanel({
  projectId,
  artifactType,
  artifactId,
  comments,
  onCommentAdded,
}: FeedbackPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<FeedbackComment[]>(comments);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await createComment(projectId, {
        artifactType,
        artifactId,
        content: newComment.trim(),
      });
      if (result.data) {
        setLocalComments((prev) => [result.data!, ...prev]);
        setNewComment("");
        onCommentAdded?.();
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await updateComment(projectId, commentId, { resolved: true });
      setLocalComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)),
      );
    } catch (err) {
      console.error("Failed to resolve comment:", err);
    }
  };

  const unresolvedComments = localComments.filter((c) => !c.resolved);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">
        Feedback {unresolvedComments.length > 0 && `(${unresolvedComments.length})`}
      </h3>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add feedback or revision notes..."
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
        <Button
          type="submit"
          size="sm"
          isLoading={isSubmitting}
          disabled={!newComment.trim()}
        >
          Add Feedback
        </Button>
      </form>

      <div className="space-y-2">
        {unresolvedComments.length === 0 && (
          <p className="text-xs text-gray-500">No open feedback items.</p>
        )}
        {unresolvedComments.map((comment) => (
          <div
            key={comment.id}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm"
          >
            <p className="text-gray-800">{comment.content}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleResolve(comment.id)}
              >
                Resolve ✓
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
