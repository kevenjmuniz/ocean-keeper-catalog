import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PublicSeller = { id: string; name: string; phone: string };

export const getActiveSellers = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSeller[]> => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await supabase
      .from("sellers")
      .select("id, name, phone")
      .eq("is_active", true)
      .order("sort_order")
      .order("name");
    if (error) throw error;
    return (data ?? []) as PublicSeller[];
  },
);
