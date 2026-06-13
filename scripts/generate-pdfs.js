const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../samples");

function createPDF(filename, title, content) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(path.join(dir, filename)));

  // Header
  doc.fontSize(8).fillColor("#666").text("CLAIMPILOT — CONFIDENTIAL", { align: "right" });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#ddd");
  doc.moveDown(1);

  // Title
  doc.fontSize(20).fillColor("#1e293b").text(title);
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#64748b").text(`Generated: ${new Date().toISOString().split("T")[0]}`);
  doc.moveDown(1.5);

  // Content
  content(doc);

  doc.end();
}

// 1. asset.pdf
createPDF("asset.pdf", "Policyholder Asset Declaration", (doc) => {
  const section = (title) => { doc.moveDown(1); doc.fontSize(12).fillColor("#1e293b").text(title); doc.moveDown(0.3); doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#e2e8f0"); doc.moveDown(0.5); };
  const row = (label, value) => { doc.fontSize(10).fillColor("#64748b").text(label, { continued: true }).fillColor("#1e293b").text(`  ${value}`); doc.moveDown(0.3); };

  section("Policyholder Information");
  row("Name:", "James Mitchell");
  row("Policy Number:", "POL-2026-8847");
  row("Policy Type:", "Comprehensive Auto Insurance");
  row("Effective Date:", "2025-03-15");
  row("Expiration Date:", "2026-03-15");
  row("Premium:", "$1,840/year");

  section("Insured Vehicles");
  row("Primary Vehicle:", "2023 Toyota Camry XSE");
  row("VIN:", "4T1BZ1HK5PU123456");
  row("License Plate:", "CA 8ABC123");
  row("Estimated Value:", "$32,500");
  row("Deductible:", "$500");

  section("Coverage Details");
  row("Collision:", "$50,000 per occurrence");
  row("Comprehensive:", "$50,000 per occurrence");
  row("Liability:", "$100,000 / $300,000");
  row("Medical Payments:", "$5,000 per person");
  row("Uninsured Motorist:", "$100,000 / $300,000");

  section("Payment Information");
  row("Method:", "Auto-pay — Visa ending in 4521");
  row("Billing Cycle:", "Monthly");
  row("Next Payment:", "$153.33 on 2026-07-15");
  row("Payment History:", "24 consecutive on-time payments");

  section("Claims History");
  row("Total Claims (lifetime):", "1");
  row("Claims (last 12 months):", "0");
  row("Last Claim:", "2024-08-10 — Minor fender bender ($2,100, approved)");
});

// 2. claim_low_risk.pdf
createPDF("claim_low_risk.pdf", "Insurance Claim — Low Risk", (doc) => {
  const section = (title) => { doc.moveDown(1); doc.fontSize(12).fillColor("#1e293b").text(title); doc.moveDown(0.3); doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#e2e8f0"); doc.moveDown(0.5); };
  const row = (label, value) => { doc.fontSize(10).fillColor("#64748b").text(label, { continued: true }).fillColor("#1e293b").text(`  ${value}`); doc.moveDown(0.3); };

  doc.fontSize(11).fillColor("#16a34a").text("RISK CLASSIFICATION: LOW");
  doc.moveDown(0.5);

  section("Claim Details");
  row("Claim ID:", "CLM-2026-1001");
  row("Policyholder:", "James Mitchell");
  row("Policy:", "POL-2026-8847 (Comprehensive Auto)");
  row("Incident Date:", "2026-06-01");
  row("Filing Date:", "2026-06-02");
  row("Claim Amount:", "$2,800");

  section("Incident Description");
  doc.fontSize(10).fillColor("#374151").text("While parked at grocery store parking lot, another vehicle reversed into the rear bumper of insured vehicle. Damage limited to rear bumper and tail light assembly. Other driver admitted fault and exchanged insurance information.");

  section("Evidence");
  row("Photos Submitted:", "6 (damage from multiple angles)");
  row("Police Report:", "Yes — Report #2026-PD-44521");
  row("Witnesses:", "2 (store employees)");
  row("Other Driver Info:", "Provided — insured by State Farm");

  section("Risk Assessment");
  row("Red Flags:", "0");
  row("Amount:", "< $5,000 threshold");
  row("Prior Claims (12mo):", "0");
  row("Expected Outcome:", "Auto-approve by Claim Reviewer");
});

// 3. claim_high_risk.pdf
createPDF("claim_high_risk.pdf", "Insurance Claim — High Risk", (doc) => {
  const section = (title) => { doc.moveDown(1); doc.fontSize(12).fillColor("#1e293b").text(title); doc.moveDown(0.3); doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#e2e8f0"); doc.moveDown(0.5); };
  const row = (label, value) => { doc.fontSize(10).fillColor("#64748b").text(label, { continued: true }).fillColor("#1e293b").text(`  ${value}`); doc.moveDown(0.3); };

  doc.fontSize(11).fillColor("#dc2626").text("RISK CLASSIFICATION: HIGH");
  doc.moveDown(0.5);

  section("Claim Details");
  row("Claim ID:", "CLM-2026-1003");
  row("Policyholder:", "Robert Chen");
  row("Policy:", "POL-2026-5523 (Comprehensive Auto)");
  row("Incident Date:", "2026-05-20");
  row("Filing Date:", "2026-06-05");
  row("Claim Amount:", "$47,500");

  section("Incident Description");
  doc.fontSize(10).fillColor("#374151").text("Policyholder reports vehicle was stolen from residential driveway overnight. Vehicle is a 2024 BMW M4 Competition. Claims total loss. Vehicle was recovered 3 days later, severely damaged (fire). Policyholder recently increased coverage limits 2 weeks before incident.");

  section("Evidence");
  row("Photos Submitted:", "2 (post-recovery only)");
  row("Police Report:", "Yes — Report #2026-PD-67891");
  row("Witnesses:", "0");
  row("Recovery Location:", "Industrial area, 15 miles from residence");

  section("Risk Indicators");
  row("Red Flags:", "4");
  row("Amount:", "> $15,000 threshold (HIGH)");
  row("Recent Coverage Increase:", "Yes — 14 days prior to incident");
  row("Filing Delay:", "16 days (> 7 day threshold)");
  row("No Witnesses:", "Yes");
  row("Prior Claims (12mo):", "2");

  section("Expected Workflow");
  doc.fontSize(10).fillColor("#374151").text("Reviewer → Investigator (fraud analysis) → Adjuster (final decision)");
});

// 4. claim_suspicious.pdf
createPDF("claim_suspicious.pdf", "Insurance Claim — Suspicious", (doc) => {
  const section = (title) => { doc.moveDown(1); doc.fontSize(12).fillColor("#1e293b").text(title); doc.moveDown(0.3); doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke("#e2e8f0"); doc.moveDown(0.5); };
  const row = (label, value) => { doc.fontSize(10).fillColor("#64748b").text(label, { continued: true }).fillColor("#1e293b").text(`  ${value}`); doc.moveDown(0.3); };

  doc.fontSize(11).fillColor("#d97706").text("RISK CLASSIFICATION: MEDIUM-HIGH (SUSPICIOUS INDICATORS)");
  doc.moveDown(0.5);

  section("Claim Details");
  row("Claim ID:", "CLM-2026-1005");
  row("Policyholder:", "Diana Vasquez");
  row("Policy:", "POL-2026-3312 (Basic Auto)");
  row("Incident Date:", "2026-06-08");
  row("Filing Date:", "2026-06-10");
  row("Claim Amount:", "$18,500");

  section("Incident Description");
  doc.fontSize(10).fillColor("#374151").text("Policyholder reports a hit-and-run collision at an intersection. Claims other vehicle ran a red light and fled the scene. Significant front-end damage to insured vehicle. No dashcam footage. Policyholder was the only occupant. Happened at 11:45 PM on a weeknight.");

  section("Evidence");
  row("Photos Submitted:", "4 (damage photos, next-day)");
  row("Police Report:", "No — claims 'too shaken to call'");
  row("Witnesses:", "0");
  row("Dashcam:", "None installed");
  row("Medical Claim:", "Yes — $3,500 for neck pain");

  section("Suspicious Indicators");
  row("Red Flags:", "3");
  row("Hit-and-run + No witnesses:", "Classic staged accident pattern");
  row("No Police Report:", "Unusual for $18,500 claim");
  row("Late-night incident:", "Low-traffic, hard to verify");
  row("Medical add-on:", "Soft tissue injury (unverifiable)");
  row("Prior Claims (12mo):", "1 (similar hit-and-run, $8,200)");

  section("Expected Workflow");
  doc.fontSize(10).fillColor("#374151").text("Reviewer classifies MEDIUM/HIGH → Investigator recruited for fraud analysis → Likely escalation to Adjuster for final verdict.");
});

console.log("✓ Generated 4 PDF files in samples/");
