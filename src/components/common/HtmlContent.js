"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

export default function HtmlContent({ html, emptyText = "Bilgi girilmemiş." }) {
  const safeHtml = useMemo(() => {
    if (!html || !html.trim()) {
      return "";
    }

    return DOMPurify.sanitize(html);
  }, [html]);

  if (!safeHtml || !safeHtml.trim()) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }

  return (
    <div
      className="
    prose prose-slate max-w-none break-words text-sm leading-7
    [&_a]:font-medium
    [&_a]:text-blue-600
    [&_a]:underline
    [&_a]:underline-offset-2
    [&_a:hover]:text-blue-800
  "
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
