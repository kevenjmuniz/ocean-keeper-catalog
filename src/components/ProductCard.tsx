import { Link } from "@tanstack/react-router";
import { Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/format";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  weight_kg?: number | null;
  unit?: string | null;
  internal_code?: string | null;
  image_url?: string | null;
  category?: { name: string } | null;
};

export function ProductCard({ p, index = 0 }: { p: ProductCardData; index?: number }) {
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant animate-card-in"
      style={{ animationDelay: `${Math.min(index, 15) * 30}ms` }}
    >
      <Link to="/produto/$slug" params={{ slug: p.slug }} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition-smooth group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
              Sem imagem
            </div>
          )}
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
            <Snowflake className="h-3 w-3 text-ocean" /> Congelado
          </div>
          {p.category?.name && (
            <div className="absolute top-3 right-3 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-medium text-primary-foreground backdrop-blur">
              {p.category.name}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-base font-semibold text-foreground leading-snug break-words line-clamp-3 min-h-[3.75rem]">
            {p.name}
          </h3>
          {p.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {p.weight_kg && <span className="rounded-md bg-muted px-2 py-1">Caixa {p.weight_kg} kg</span>}
            {p.unit && <span className="rounded-md bg-muted px-2 py-1">{p.unit}</span>}
            {p.internal_code && (
              <span className="rounded-md bg-muted px-2 py-1 font-mono">Cód. {p.internal_code}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-auto px-5 pb-5">
        <Button
          asChild
          className="w-full rounded-xl bg-gradient-ocean text-primary-foreground hover:opacity-95 shadow-soft"
        >
          <a
            href={buildWhatsAppLink(`Olá M2i, gostaria de um orçamento para *${p.name}*.`)}
            target="_blank"
            rel="noreferrer"
          >
            Solicitar orçamento
          </a>
        </Button>
      </div>
    </article>
  );
}
