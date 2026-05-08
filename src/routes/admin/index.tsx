import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, Tags, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, active, cats, latest] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id, name, created_at, image_url, category:categories(name)").order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        total: products.count ?? 0,
        active: active.count ?? 0,
        cats: cats.count ?? 0,
        latest: latest.data ?? [],
      };
    },
  });

  const cards = [
    { label: "Total de produtos", value: stats?.total ?? "—", icon: Package, color: "from-primary to-ocean" },
    { label: "Produtos ativos", value: stats?.active ?? "—", icon: CheckCircle2, color: "from-ocean to-gold" },
    { label: "Categorias", value: stats?.cats ?? "—", icon: Tags, color: "from-gold to-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do catálogo M2i.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-3xl font-semibold">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Últimos importados</h2>
          </div>
          <Link to="/admin/produtos" className="text-xs text-ocean hover:underline">Ver todos →</Link>
        </div>
        <ul className="divide-y divide-border">
          {(stats?.latest ?? []).length === 0 && (
            <li className="px-6 py-12 text-center text-sm text-muted-foreground">
              Nenhum produto cadastrado ainda. <Link to="/admin/importar" className="text-ocean hover:underline">Importar agora</Link>
            </li>
          )}
          {stats?.latest.map((p: any) => (
            <li key={p.id} className="flex items-center gap-4 px-6 py-4">
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.category?.name ?? "Sem categoria"}</div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
