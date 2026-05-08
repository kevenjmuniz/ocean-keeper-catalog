import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Snowflake, ShieldCheck, Truck, Award } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — M2i Comercial" },
      { name: "description", content: "Conheça a M2i Comercial: distribuidora B2B de pescados congelados premium para restaurantes, sushis e peixarias." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-gradient-hero py-24 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Sobre nós</div>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl text-balance">
            Pescados premium, com a confiança que o seu negócio merece.
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/80">
            A M2i Comercial é referência em distribuição B2B de pescados congelados. Da seleção rigorosa
            à entrega refrigerada, cuidamos de cada etapa para você focar no que importa: encantar seus clientes.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Snowflake, title: "Cadeia fria", desc: "Controle térmico do fornecedor à porta do cliente." },
            { icon: ShieldCheck, title: "Origem certificada", desc: "Produtos rastreados, com padrão sanitário rigoroso." },
            { icon: Truck, title: "Logística ágil", desc: "Entregas programadas e regulares no food service." },
            { icon: Award, title: "Atendimento consultivo", desc: "Time que entende sua operação e seu cardápio." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-ocean text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-lg font-semibold text-foreground">{f.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}
