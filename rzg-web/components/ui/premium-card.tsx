export function PremiumCard({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`${hover ? "surface-card surface-card-hover" : "surface-card"} ${className}`}>
      {children}
    </div>
  );
}
