import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase: SupabaseClient = url && key
  ? createClient(url, key)
  : (new Proxy({} as SupabaseClient, {
      get: () => () => ({ data: null, error: { message: "Supabase not configured" } }),
    }));
