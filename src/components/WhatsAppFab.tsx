import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/format";

export function WhatsAppFab({ message }: { message?: string }) {
  return (
    <a
      href={buildWhatsAppLink(message || "Olá M2i, gostaria de solicitar um orçamento.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant transition-smooth hover:scale-110 animate-float"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
