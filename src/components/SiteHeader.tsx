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
    <header className="sticky top-0 z-40 border-b border-[#001B44] bg-[#001B44] text-white">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="M2i Comercial">
          <img
            src={logoM2i}
            alt="M2i Comercial"
            className="h-10 w-auto transition-smooth group-hover:opacity-90"
          />
        </Link>

        {showSearch && (
          <div className="relative flex-1 max-w-2xl group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00AEEF] transition-smooth" />
            <Input
              value={query ?? ""}
              onChange={(e) => onQueryChange!(e.target.value)}
              placeholder="Buscar produtos, categorias, código..."
              className="pl-10 pr-9 h-11 rounded-full bg-white border border-white text-[#001B44] placeholder:text-[#A6A6A6] caret-[#001B44] focus-visible:bg-white focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/40"
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
            className="hidden sm:inline-flex items-center rounded-full border border-white bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#001B44] transition-smooth hover:bg-white/90"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
