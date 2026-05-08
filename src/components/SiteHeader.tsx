import { Link } from "@tanstack/react-router";
import { Fish, Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/format";

const nav = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-soft transition-smooth group-hover:shadow-glow">
            <Fish className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-foreground">M2i</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Comercial</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground rounded-lg hover:bg-accent"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <a
            href={buildWhatsAppLink("Olá M2i, gostaria de mais informações.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-smooth hover:border-ocean hover:text-ocean"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
            <Link to="/catalogo">Ver Catálogo</Link>
          </Button>
        </div>

        <button
          aria-label="Menu"
          onClick={() => setOpen(!open)}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-foreground hover:bg-accent"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background animate-fade-up">
          <div className="space-y-1 px-4 py-4">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/catalogo"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Ver Catálogo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
