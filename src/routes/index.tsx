import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Snowflake, Truck, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-seafood.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "M2i Comercial — Pescados congelados premium para o food service" },
      { name: "description", content: "Distribuidora B2B de pescados congelados. Salmão, camarão, peixes nobres com logística refrigerada para restaurantes, sushis e peixarias." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: featured } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, description, weight_kg, unit, image_url, category:categories(name)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(8);
      if (error) throw error;
      return data as ProductCardData[];
    },
  });

  const { data: latest } = useQuery({
    queryKey: ["latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, description, weight_kg, unit, image_url, category:categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as ProductCardData[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,oklch(0.72_0.16_230/0.4),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center text-primary-foreground animate-fade-up">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
              <Sparkles className="h-3 w-3 text-gold" /> Distribuidora B2B premium
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
              Pescados congelados de <span className="bg-gradient-to-r from-gold to-ocean bg-clip-text text-transparent">altíssimo padrão</span> para o seu negócio.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
              Catálogo digital exclusivo para restaurantes, peixarias, sushis e distribuidores.
              Qualidade garantida, regularidade no abastecimento e logística refrigerada.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-gradient-ocean text-primary-foreground hover:opacity-95 shadow-glow">
                <Link to="/catalogo">
                  Ver catálogo completo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/30 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link to="/contato">Falar com consultor</Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4 max-w-md">
              {[
                { icon: Snowflake, label: "Cadeia de frio" },
                { icon: ShieldCheck, label: "Origem certificada" },
                { icon: Truck, label: "Logística B2B" },
              ].map((f) => (
                <div key={f.label} className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                    <f.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div className="mt-2 text-xs text-primary-foreground/70">{f.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-elegant ring-1 ring-white/10">
              <img
                src={heroImg}
                alt="Pescados congelados premium"
                width={1600}
                height={1200}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden md:block rounded-2xl bg-background/95 backdrop-blur p-4 shadow-elegant border border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Catálogo atualizado</div>
                  <div className="text-sm font-semibold text-foreground">Novidades semanais</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHead eyebrow="Categorias" title="Navegue por categoria" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/catalogo"
                search={{ category: c.slug } as never}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-ocean">Categoria</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{c.name}</div>
                {c.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
                <ArrowRight className="mt-4 h-4 w-4 text-muted-foreground transition-smooth group-hover:translate-x-1 group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHead eyebrow="Destaques" title="Produtos em destaque" cta={<Link to="/catalogo" className="text-sm font-medium text-ocean hover:underline">Ver todos →</Link>} />
        <ProductGrid items={featured} emptyLabel="Nenhum destaque cadastrado ainda." />
      </section>

      {/* Latest */}
      <section className="bg-gradient-subtle py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHead eyebrow="Novidades" title="Mais recentes no catálogo" />
          <ProductGrid items={latest} emptyLabel="Comece adicionando produtos no painel admin." />
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">Sobre a M2i</span>
            <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Parceira estratégica do food service brasileiro.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Há anos a M2i Comercial atende restaurantes, sushis, peixarias e distribuidores
              com pescados congelados de origem certificada, padronização rigorosa e atendimento
              consultivo. Nosso compromisso: regularidade, frescor e confiança em cada caixa entregue.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6">
              {[["+500", "Clientes B2B"], ["20+", "Categorias"], ["100%", "Cadeia fria"]].map(([n, l]) => (
                <div key={l}>
                  <div className="text-2xl font-semibold text-primary">{n}</div>
                  <div className="text-xs text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-hero p-10 text-primary-foreground shadow-elegant">
            <Sparkles className="h-8 w-8 text-gold" />
            <p className="mt-4 text-lg font-medium leading-relaxed">
              "A M2i transformou nosso fluxo de compras. Variedade, qualidade impecável e um time que
              entende o que o restaurante precisa."
            </p>
            <div className="mt-6 text-sm text-primary-foreground/70">— Chef parceiro, São Paulo</div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}

function SectionHead({ eyebrow, title, cta }: { eyebrow: string; title: string; cta?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">{eyebrow}</div>
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
      </div>
      {cta}
    </div>
  );
}

function ProductGrid({ items, emptyLabel }: { items?: ProductCardData[]; emptyLabel: string }) {
  if (!items) {
    return (
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="mt-10 text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}
