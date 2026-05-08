import { Link } from "@tanstack/react-router";
import { Search, X, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import logoM2i from "@/assets/logo-m2i.png";

type Props = {
  query?: string;
  onQueryChange?: (v: string) => void;
};

export function SiteHeader({ query, onQueryChange }: Props) {
  const showSearch = typeof onQueryChange === "function";
  return (
    <header
      className="sticky top-0 z-40 border-b border-[#001B44] text-white relative isolate"
      style={{
        backgroundColor: "#001B44",
        backgroundImage: [
          "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(0,43,107,0.55), transparent 60%)",
          "radial-gradient(ellipse 70% 60% at 100% 100%, rgba(0,31,82,0.65), transparent 65%)",
          "linear-gradient(135deg, #001B44 0%, #002B6B 50%, #001F52 100%)",
          // very subtle SVG noise/grain
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        ].join(", "),
        backgroundBlendMode: "overlay, overlay, normal, overlay",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 0 rgba(0,0,0,0.2)",
      }}
    >
      <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8 relative">
        <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="M2i Comercial">
          <img
            src={logoM2i}
            alt="M2i Comercial"
            className="h-14 sm:h-16 w-auto transition-smooth group-hover:opacity-90"
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
            aria-label="Conta"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-smooth hover:bg-white/20"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
