import { createServerFn } from "@tanstack/react-start";

export type PublicSeller = { id: string; name: string; phone: string };

export const getActiveSellers = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSeller[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("sellers")
      .select("id, name, phone")
      .eq("is_active", true)
      .order("sort_order")
      .order("name");
    if (error) throw error;
    return (data ?? []) as PublicSeller[];
  },
);
