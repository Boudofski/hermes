export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-b border-white/10 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
      <div className="min-w-0">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-300">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
