import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/catalogo")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Catálogo de pescados congelados — M2i Comercial" },
      { name: "description", content: "Catálogo completo de pescados congelados M2i: salmão, camarão, peixes nobres e mais. Solicite seu orçamento B2B." },
      { property: "og:title", content: "Catálogo M2i — Pescados Congelados" },
      { property: "og:description", content: "Explore nosso catálogo digital com filtros por categoria, busca instantânea e cotação rápida via WhatsApp." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(search.q ?? "");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", search.category],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, slug, name, description, weight_kg, unit, image_url, category:categories!inner(id, name, slug)")
        .eq("is_active", true)
        .order("name");
      if (search.category) {
        q = q.eq("categories.slug", search.category);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as (ProductCardData & { category: { slug: string } })[];
    },
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term),
    );
  }, [products, query]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">Catálogo digital</div>
              <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">Nossos produtos</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Use os filtros e a busca para encontrar rapidamente o que precisa. Clique para solicitar orçamento.
              </p>
            </div>
            <div className="relative md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou descrição..."
                className="pl-9 rounded-full bg-background"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1" />
            <FilterChip
              label="Todas"
              active={!search.category}
              onClick={() => navigate({ search: { ...search, category: undefined } })}
            />
            {categories?.map((c) => (
              <FilterChip
                key={c.id}
                label={c.name}
                active={search.category === c.slug}
                onClick={() => navigate({ search: { ...search, category: c.slug } })}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
            <Button onClick={() => { setQuery(""); navigate({ search: {} }); }} variant="outline" className="mt-4 rounded-full">
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-smooth " +
        (active
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}
