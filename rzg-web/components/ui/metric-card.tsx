export function MetricCard({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  detail?: string;
}) {
  return (
    <div className="surface-card min-w-0 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="brand-mark h-10 w-10">{icon}</div>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">Live</span>
      </div>
      <p className="text-sm font-semibold text-slate-300">{label}</p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-white">{value}</p>
      {detail && <p className="mt-2 break-words text-xs leading-5 text-slate-300">{detail}</p>}
    </div>
  );
}
