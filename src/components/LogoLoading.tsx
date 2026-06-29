import logoBomMarujo from "@/assets/logo-bom-marujo.svg";

export function LogoLoading({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#001B44]">
      <div className="logo-breathe flex flex-col items-center gap-6">
        <img
          src={logoBomMarujo}
          alt="Carregando"
          className="h-32 w-auto sm:h-40"
        />
        <p className="text-sm font-medium tracking-wider text-white/80 uppercase">
          {message}
        </p>
      </div>
    </div>
  );
}
