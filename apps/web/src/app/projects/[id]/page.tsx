"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    // Redirect to the research stage as the default project view
    router.replace(`/projects/${params.id}/research`);
  }, [params.id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-500">Loading project...</p>
      </div>
    </div>
  );
}
