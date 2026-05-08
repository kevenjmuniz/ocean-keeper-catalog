import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Snowflake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink, formatBRL } from "@/lib/format";

export const Route = createFileRoute("/produto/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(id, name, slug)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!isLoading && !product) throw notFound();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao catálogo
        </Link>

        {isLoading || !product ? (
          <div className="mt-8 grid animate-pulse gap-10 lg:grid-cols-2">
            <div className="aspect-square rounded-3xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded bg-muted" />
              <div className="h-24 rounded bg-muted" />
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-12 lg:grid-cols-2">
            <ProductGallery
              mainImage={product.image_url}
              gallery={(product as any).gallery_images ?? []}
              name={product.name}
            />
            <div>
              {product.category?.name && (
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">{product.category.name}</div>
              )}
              <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">{product.name}</h1>
              {product.description && (
                <p className="mt-4 leading-relaxed text-muted-foreground">{product.description}</p>
              )}

              <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
                {product.weight_kg && <Info label="Peso da caixa" value={`${product.weight_kg} kg`} />}
                {product.unit && <Info label="Unidade" value={product.unit} />}
                {product.subcategory && <Info label="Subcategoria" value={product.subcategory} />}
                {product.internal_code && <Info label="Código interno" value={product.internal_code} />}
                {product.price && <Info label="Preço sugerido" value={formatBRL(Number(product.price))} />}
              </dl>

              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-gradient-ocean shadow-glow">
                  <a
                    href={buildWhatsAppLink(`Olá M2i, gostaria de orçamento para *${product.name}*${product.internal_code ? ` (cód. ${product.internal_code})` : ""}.`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Solicitar orçamento via WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link to="/">Ver mais produtos</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <WhatsAppFab message={product ? `Orçamento para ${product.name}` : undefined} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-semibold text-foreground">{value}</dd>
    </div>
  );
}
