import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/format";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — M2i Comercial" },
      { name: "description", content: "Fale com a M2i Comercial: solicite orçamento, conheça nosso catálogo B2B e abra cadastro como cliente." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean">Contato</div>
          <h1 className="mt-2 text-4xl font-semibold text-foreground sm:text-5xl text-balance">
            Vamos conversar sobre o seu próximo pedido.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Atendimento exclusivo B2B. Solicite seu orçamento e abra cadastro com nossa equipe comercial.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Phone, label: "Telefone", value: "(11) 99999-9999" },
            { icon: Mail, label: "E-mail", value: "contato@m2icomercial.com.br" },
            { icon: MapPin, label: "Endereço", value: "São Paulo, SP" },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
              <div className="mt-1 font-semibold text-foreground">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-elegant">
          <h2 className="text-2xl font-semibold">Atendimento direto pelo WhatsApp</h2>
          <p className="mt-2 text-primary-foreground/80">Resposta rápida do time comercial M2i.</p>
          <Button asChild size="lg" className="mt-6 rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-glow">
            <a href={buildWhatsAppLink("Olá M2i, quero abrir cadastro como cliente B2B.")} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Falar agora no WhatsApp
            </a>
          </Button>
        </div>
      </section>
      <SiteFooter />
      <WhatsAppFab />
    </div>
  );
}
