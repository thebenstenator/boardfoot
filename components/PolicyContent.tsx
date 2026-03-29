'use client'

import dynamic from "next/dynamic";

const PolicyHtml = dynamic(
  () => import("./PolicyHtml").then((m) => m.PolicyHtml),
  { ssr: false }
);

export function PolicyContent({ html }: { html: string }) {
  return <PolicyHtml html={html} />;
}
