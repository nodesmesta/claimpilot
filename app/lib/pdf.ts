import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strings = content.items.map((item: any) => item.str || "").filter(Boolean);
    text += strings.join(" ") + "\n";
  }
  await doc.destroy();
  return text;
}
