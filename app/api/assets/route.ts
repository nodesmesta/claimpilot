import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabase } from "@/app/lib/supabase";

async function getUserFromRequest(req: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF file required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { extractTextFromPDF } = await import("@/app/lib/pdf");
    const text = await extractTextFromPDF(buffer);

    // Parse structured data from PDF text
    const data = parseAssetPDF(text);

    // Store in DB
    const { data: inserted, error } = await supabase.from("assets").insert({
      user_id: user.id,
      policyholder: data.policyholder,
      policy_number: data.policy_number,
      policy_type: data.policy_type,
      effective_date: data.effective_date,
      expiration_date: data.expiration_date,
      premium: data.premium,
      vehicle_description: data.vehicle_description,
      vin: data.vin,
      license_plate: data.license_plate,
      estimated_value: data.estimated_value,
      deductible: data.deductible,
      coverage_collision: data.coverage_collision,
      coverage_comprehensive: data.coverage_comprehensive,
      coverage_liability: data.coverage_liability,
      payment_method: data.payment_method,
      billing_cycle: data.billing_cycle,
      claims_history_total: data.claims_history_total,
      claims_history_12mo: data.claims_history_12mo,
      raw_text: text,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, asset: inserted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

function parseAssetPDF(text: string) {
  // Text from pdfjs comes as space-separated, not newlines.
  // Use non-greedy match stopping at next keyword.
  const get = (pattern: RegExp): string | null => {
    const m = text.match(pattern);
    return m ? m[1].trim() : null;
  };
  const getNum = (pattern: RegExp): number | null => {
    const v = get(pattern);
    if (!v) return null;
    const n = parseFloat(v.replace(/[,$]/g, ""));
    return isNaN(n) ? null : n;
  };

  return {
    policyholder: get(/Name:\s+([A-Z][a-z]+ [A-Z][a-z]+)/i) || "Unknown",
    policy_number: get(/Policy Number:\s+(POL-[\w-]+)/i) || `POL-${Date.now()}`,
    policy_type: get(/Policy Type:\s+(.+?)(?:\s+Effective|\s+$)/i),
    effective_date: get(/Effective Date:\s+(\d{4}-\d{2}-\d{2})/i),
    expiration_date: get(/Expiration Date:\s+(\d{4}-\d{2}-\d{2})/i),
    premium: get(/Premium:\s+(\$[\d,]+\/\w+)/i),
    vehicle_description: get(/Primary Vehicle:\s+(.+?)(?:\s+VIN:)/i),
    vin: get(/VIN:\s+([\w]+)/i),
    license_plate: get(/License Plate:\s+(.+?)(?:\s+Estimated)/i),
    estimated_value: getNum(/Estimated Value:\s+\$?([\d,]+)/i),
    deductible: getNum(/Deductible:\s+\$?([\d,]+)/i),
    coverage_collision: get(/Collision:\s+(\$[\d,]+ per \w+)/i),
    coverage_comprehensive: get(/Comprehensive:\s+(\$[\d,]+ per \w+)/i),
    coverage_liability: get(/Liability:\s+(\$[\d,\/\s]+)/i),
    payment_method: get(/Method:\s+(.+?)(?:\s+Billing)/i),
    billing_cycle: get(/Billing Cycle:\s+(\w+)/i),
    claims_history_total: parseInt(get(/Total Claims \(lifetime\):\s+(\d+)/i) || "0"),
    claims_history_12mo: parseInt(get(/Claims \(last 12 months\):\s+(\d+)/i) || "0"),
  };
}
