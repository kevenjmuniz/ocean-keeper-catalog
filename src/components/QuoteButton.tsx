import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getActiveSellers, type PublicSeller } from "@/lib/sellers.functions";

type Seller = PublicSeller;

function useSellers() {
  const fetchSellers = useServerFn(getActiveSellers);
  return useQuery({
    queryKey: ["sellers-active"],
    queryFn: () => fetchSellers(),
    staleTime: 60_000,
  });
}

const waLink = (phone: string, msg: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;

export function QuoteButton({
  message,
  children = "Solicitar orçamento",
  className,
  ...buttonProps
}: { message: string; children?: React.ReactNode } & ButtonProps) {
  const { data: sellers = [] } = useSellers();

  if (sellers.length === 1) {
    return (
      <Button asChild className={className} {...buttonProps}>
        <a href={waLink(sellers[0].phone, message)} target="_blank" rel="noreferrer">
          {children}
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className} {...buttonProps}>{children}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        <DropdownMenuLabel>Escolha um vendedor</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sellers.length === 0 ? (
          <DropdownMenuItem disabled>Nenhum vendedor disponível</DropdownMenuItem>
        ) : (
          sellers.map((s) => (
            <DropdownMenuItem key={s.id} asChild>
              <a href={waLink(s.phone, message)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
                {s.name}
              </a>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function QuoteFab({ message }: { message?: string }) {
  const { data: sellers = [] } = useSellers();
  const msg = message || "Olá M2i, gostaria de solicitar um orçamento.";

  const fabClass = cn(
    "fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant transition-smooth hover:scale-110 animate-float",
  );

  if (sellers.length <= 1) {
    const phone = sellers[0]?.phone ?? "5511937392121";
    return (
      <a
        href={waLink(phone, msg)}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        className={fabClass}
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Falar no WhatsApp" className={fabClass}>
          <MessageCircle className="h-6 w-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-56 mb-2">
        <DropdownMenuLabel>Escolha um vendedor</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sellers.map((s) => (
          <DropdownMenuItem key={s.id} asChild>
            <a href={waLink(s.phone, msg)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
              {s.name}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
