import { AlertCircle, CheckCircle2, Clock, Radio, XCircle } from "lucide-react";

const statusConfig: Record<string, { className: string; label: string; icon: React.ElementType }> = {
  active: { className: "badge-green", label: "Active", icon: Radio },
  inactive: { className: "badge-muted", label: "Inactive", icon: XCircle },
  completed: { className: "badge-green", label: "Completed", icon: CheckCircle2 },
  running: { className: "badge-yellow", label: "Running", icon: Clock },
  failed: { className: "badge-red", label: "Failed", icon: AlertCircle },
  pending: { className: "badge-muted", label: "Pending", icon: Clock },
  cancelled: { className: "badge-muted", label: "Cancelled", icon: XCircle },
  online: { className: "badge-green", label: "Online", icon: Radio },
  live: { className: "badge-blue", label: "Live", icon: Radio },
  ready: { className: "badge-cyan", label: "Ready", icon: CheckCircle2 },
  idle: { className: "badge-muted", label: "Idle", icon: Clock },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  const Icon = cfg.icon;
  return (
    <span className={`badge ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {label ?? cfg.label}
    </span>
  );
}
