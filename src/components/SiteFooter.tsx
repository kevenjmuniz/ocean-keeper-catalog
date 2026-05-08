import { Link } from "@tanstack/react-router";
import { Fish, Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-ocean shadow-glow">
                <Fish className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-lg font-semibold">M2i Comercial</div>
                <div className="text-xs uppercase tracking-[0.18em] text-primary-foreground/60">
                  Distribuidora de pescados congelados
                </div>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-primary-foreground/70">
              Atendimento B2B premium para restaurantes, peixarias, sushis e distribuidores.
              Qualidade, regularidade e logística refrigerada do Brasil para a sua mesa.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-gold">Navegação</div>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
              <li><Link to="/catalogo" className="hover:text-gold transition-smooth">Catálogo</Link></li>
              <li><Link to="/sobre" className="hover:text-gold transition-smooth">Sobre</Link></li>
              <li><Link to="/contato" className="hover:text-gold transition-smooth">Contato</Link></li>
              <li><Link to="/login" className="hover:text-gold transition-smooth">Área Admin</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-gold">Contato</div>
            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5" /> (11) 99999-9999</li>
              <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5" /> contato@m2icomercial.com.br</li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5" /> São Paulo, SP</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-primary-foreground/60">
          <div>© {new Date().getFullYear()} M2i Comercial. Todos os direitos reservados.</div>
          <div>Catálogo digital B2B • Pescados congelados premium</div>
        </div>
      </div>
    </footer>
  );
}
