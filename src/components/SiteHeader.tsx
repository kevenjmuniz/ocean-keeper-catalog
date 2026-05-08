import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import logoM2i from "@/assets/logo-m2i.png";

type Props = {
  query?: string;
  onQueryChange?: (v: string) => void;
};

export function SiteHeader({ query, onQueryChange }: Props) {
  const showSearch = typeof onQueryChange === "function";
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-soft transition-smooth group-hover:shadow-glow">
            <Fish className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-base font-semibold tracking-tight text-foreground">M2i</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Comercial</div>
          </div>
        </Link>

        {showSearch && (
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query ?? ""}
              onChange={(e) => onQueryChange!(e.target.value)}
              placeholder="Buscar produtos, categorias, código..."
              className="pl-10 pr-9 h-11 rounded-full bg-muted/40 border-transparent focus-visible:bg-background"
            />
            {query && (
              <button
                onClick={() => onQueryChange!("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/admin"
            className="hidden sm:inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-smooth hover:border-foreground hover:text-foreground"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
