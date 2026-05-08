import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, Layers, Filter } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import lemeImg from "@/assets/leme.png";

const PAGE_SIZE = 12;

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Catálogo M2i — Pescados congelados premium" },
      { name: "description", content: "Catálogo digital B2B de pescados congelados M2i. Busca instantânea, filtros por categoria e cotação rápida via WhatsApp." },
      { property: "og:title", content: "Catálogo M2i — Pescados Congelados" },
      { property: "og:description", content: "Vitrine digital de pescados congelados premium para food service." },
    ],
  }),
  component: CatalogHome,
});

function CatalogHome() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(search.q ?? "");
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("sort_order")
        .order("name");
      return data ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["product-count", search.category],
    queryFn: async () => {
      let q = supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true);
      if (search.category) {
        const cat = categories?.find((c) => c.slug === search.category);
        if (cat) q = q.eq("category_id", cat.id);
      }
      const { count } = await q;
      return count ?? 0;
    },
    enabled: !search.category || !!categories,
  });

  const productsQuery = useInfiniteQuery({
    queryKey: ["catalog-products", search.category, debounced],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("products")
        .select("id, slug, name, description, weight_kg, unit, image_url, category:categories(name, slug)")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("name")
        .range(from, to);

      if (search.category) {
        const cat = categories?.find((c) => c.slug === search.category);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (debounced.trim()) {
        const term = `%${debounced.trim()}%`;
        q = q.or(`name.ilike.${term},description.ilike.${term},internal_code.ilike.${term}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as ProductCardData[];
    },
    getNextPageParam: (last, all) => (last.length < PAGE_SIZE ? undefined : all.length),
    enabled: !search.category || !!categories,
  });

  const products = useMemo(
    () => productsQuery.data?.pages.flat() ?? [],
    [productsQuery.data],
  );

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
        productsQuery.fetchNextPage();
      }
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [productsQuery]);

  const setCategory = (slug?: string) => {
    navigate({ search: { ...search, category: slug } });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative ship wheel watermark */}
      <img
        src={lemeImg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none fixed -top-24 -right-32 w-[420px] sm:w-[560px] lg:w-[780px] opacity-[0.05] sm:opacity-[0.07] lg:opacity-[0.09] z-0 [filter:grayscale(0.8)_blur(1px)]"
      />
      <SiteHeader query={query} onQueryChange={setQuery} />

      {/* Mobile category filter trigger */}
      <div className="border-b border-border/60 bg-background/60 lg:hidden">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="text-xs text-muted-foreground truncate">
            {search.category
              ? categories?.find((c) => c.slug === search.category)?.name ?? "Categoria"
              : "Todas as categorias"}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-2">
                <Filter className="h-4 w-4" /> Filtrar categorias
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm">
              <SheetHeader>
                <SheetTitle>Categorias</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 space-y-1">
                <li>
                  <SidebarItem
                    label="Todas as categorias"
                    active={!search.category}
                    onClick={() => setCategory(undefined)}
                  />
                </li>
                {categories?.map((c) => (
                  <li key={c.id}>
                    <SidebarItem
                      label={c.name}
                      active={search.category === c.slug}
                      onClick={() => setCategory(c.slug)}
                    />
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>


      <div className="mx-auto max-w-[1400px] gap-8 px-4 py-8 sm:px-6 lg:flex lg:px-8">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-[140px] space-y-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                <Layers className="h-3.5 w-3.5 text-gold" /> Categorias
              </div>
              <ul className="space-y-1">
                <li>
                  <SidebarItem
                    label="Todas as categorias"
                    active={!search.category}
                    onClick={() => setCategory(undefined)}
                  />
                </li>
                {categories?.map((c) => (
                  <li key={c.id}>
                    <SidebarItem
                      label={c.name}
                      active={search.category === c.slug}
                      onClick={() => setCategory(c.slug)}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ocean">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Atendimento B2B
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Pedidos mínimos por caixa fechada. Solicite cotação direta pelo WhatsApp em cada produto.
              </p>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <section className="flex-1 min-w-0">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                {search.category
                  ? categories?.find((c) => c.slug === search.category)?.name ?? "Catálogo"
                  : "Todos os produtos"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {counts != null ? `${counts} produto${counts === 1 ? "" : "s"} disponíveis` : "Carregando..."}
                {debounced && ` — buscando "${debounced}"`}
              </p>
            </div>
          </div>

          {productsQuery.isLoading ? (
            <Grid>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
              ))}
            </Grid>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center">
              <p className="text-muted-foreground">Nenhum produto encontrado.</p>
              <Button
                onClick={() => { setQuery(""); navigate({ search: {} }); }}
                variant="outline"
                className="mt-4 rounded-full"
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <>
              <Grid>
                {products.map((p) => <ProductCard key={p.id} p={p} />)}
              </Grid>
              <div ref={sentinelRef} className="h-12" />
              {productsQuery.isFetchingNextPage && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Carregando mais produtos...
                </div>
              )}
              {!productsQuery.hasNextPage && products.length > PAGE_SIZE && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Você chegou ao fim do catálogo.
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <WhatsAppFab />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {children}
    </div>
  );
}


function SidebarItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "w-full text-left rounded-lg px-3 py-2 text-sm transition-smooth border-l-2 " +
        (active
          ? "bg-gold/10 text-gold font-semibold border-gold"
          : "border-transparent text-muted-foreground hover:bg-gold/5 hover:text-gold hover:border-gold/40")
      }
    >
      {label}
    </button>
  );
}
