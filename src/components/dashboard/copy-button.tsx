"use client";

import { useState } from "react";

export function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className="rounded-full border border-border px-3 py-1 text-xs transition hover:border-primary hover:text-primary"
      onClick={handleCopy}
    >
      {copied ? "Copied!" : "Copy markdown"}
    </button>
  );
}
