import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SlidersHorizontal, Layers, Filter } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { QuoteFab } from "@/components/QuoteButton";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";


const PAGE_SIZE = 18;

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
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
  const page = search.page ?? 1;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  // Reset page to 1 when search query (debounced) changes
  useEffect(() => {
    if ((search.q ?? "") !== debounced) {
      navigate({ search: { ...search, q: debounced || undefined, page: undefined } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

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
    queryKey: ["product-count", search.category, debounced],
    queryFn: async () => {
      let q = supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true);
      if (search.category) {
        const cat = categories?.find((c) => c.slug === search.category);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (debounced.trim()) {
        const term = `%${debounced.trim()}%`;
        q = q.or(`name.ilike.${term},description.ilike.${term},internal_code.ilike.${term}`);
      }
      const { count } = await q;
      return count ?? 0;
    },
    enabled: !search.category || !!categories,
  });

  const productsQuery = useQuery({
    queryKey: ["catalog-products", search.category, debounced, page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let q = supabase
        .from("products")
        .select("id, slug, name, description, weight_kg, unit, internal_code, image_url, is_available, category:categories(name, slug)")
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
    enabled: !search.category || !!categories,
  });

  const products = productsQuery.data ?? [];
  const totalPages = Math.max(1, Math.ceil((counts ?? 0) / PAGE_SIZE));

  const setCategory = (slug?: string) => {
    navigate({ search: { ...search, category: slug, page: undefined } });
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    navigate({ search: { ...search, page: p === 1 ? undefined : p } });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Build page numbers with ellipsis
  const pageNumbers: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("ellipsis");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pageNumbers.push(i);
    if (page < totalPages - 2) pageNumbers.push("ellipsis");
    pageNumbers.push(totalPages);
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
                {counts != null ? `${counts} produto${counts === 1 ? "" : "s"}` : "Carregando..."}
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
              <Grid key={page}>
                {products.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
              </Grid>

              {totalPages > 1 && (
                <Pagination className="mt-10">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => { e.preventDefault(); goToPage(page - 1); }}
                        aria-disabled={page <= 1}
                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {pageNumbers.map((p, idx) =>
                      p === "ellipsis" ? (
                        <PaginationItem key={`e-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={p === page}
                            onClick={(e) => { e.preventDefault(); goToPage(p); }}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => { e.preventDefault(); goToPage(page + 1); }}
                        aria-disabled={page >= totalPages}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </section>
      </div>

      <QuoteFab />
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
