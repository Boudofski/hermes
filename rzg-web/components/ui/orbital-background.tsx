export function OrbitalBackground({ dense = false }: { dense?: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={dense ? "rzg-grid-fine absolute inset-0 opacity-60" : "rzg-grid absolute inset-0 opacity-80"} />
      <div className="rzg-noise absolute inset-0" />
      <div className="orbital-ring animate-orbit absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full opacity-70" />
      <div className="orbital-ring animate-orbit absolute right-[-16rem] top-28 h-[34rem] w-[34rem] rounded-full opacity-45 [animation-duration:54s]" />
      <div className="absolute left-[12%] top-28 h-px w-2/3 bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />
    </div>
  );
}
