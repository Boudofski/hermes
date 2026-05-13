import Link from "next/link";

type Props = {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

const variants = {
  primary: "button-primary",
  secondary: "button-secondary",
  danger: "button-danger",
};

export function CommandButton({
  children,
  href,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
  onClick,
}: Props) {
  const cls = `${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
