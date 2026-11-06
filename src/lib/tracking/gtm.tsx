import React from "react";

export function GtmHeadScript({ gtmId }: { gtmId?: string | null }) {
  if (!gtmId || !gtmId.trim()) return null;
  const cleanId = gtmId.trim();

  const code = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'dataLayer','${cleanId}');`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function GtmBodyNoScript({ gtmId }: { gtmId?: string | null }) {
  if (!gtmId || !gtmId.trim()) return null;
  const cleanId = gtmId.trim();

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${cleanId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
