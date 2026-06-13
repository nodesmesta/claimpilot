declare module "pdf-parse" {
  interface PDFResult {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }
  function pdfParse(buffer: Buffer): Promise<PDFResult>;
  export default pdfParse;
}
