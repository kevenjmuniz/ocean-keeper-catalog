import logoBomMarujo from "@/assets/logo-bom-marujo.svg";

export function LogoWatermark() {
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 z-0 pointer-events-none select-none overflow-hidden"
      style={{ width: "35vw", maxWidth: 420, height: "35vw", maxHeight: 420 }}
    >
      <img
        src={logoBomMarujo}
        alt=""
        className="absolute -top-8 -right-8 h-auto w-full object-contain opacity-[0.10]"
        draggable={false}
      />
    </div>
  );
}
