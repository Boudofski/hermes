export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface-card mx-auto max-w-lg px-8 py-12 text-center">
      <div className="brand-mark mx-auto mb-5 h-14 w-14">{icon}</div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-300">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
