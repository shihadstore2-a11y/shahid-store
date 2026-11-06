import React from "react";

export function GoogleSearchConsoleMeta({ verificationCode }: { verificationCode?: string | null }) {
  if (!verificationCode || !verificationCode.trim()) return null;
  return (
    <meta name="google-site-verification" content={verificationCode.trim()} />
  );
}
