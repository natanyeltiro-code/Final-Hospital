export const downloadWordDocument = (filename, title, bodyHtml) => {
  const documentHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 26px; margin-bottom: 8px; }
      h2 { font-size: 18px; margin: 24px 0 8px; }
      p, li { font-size: 14px; line-height: 1.6; }
      .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
      .muted { color: #475569; }
      .divider { border-top: 1px solid #cbd5e1; margin: 16px 0; }
      .label { font-weight: 700; color: #334155; }
      ul { margin: 8px 0 0 18px; padding: 0; }
      pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;

  const blob = new Blob(["\ufeff", documentHtml], { type: "application/msword" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  link.click();
  window.URL.revokeObjectURL(url);
};
