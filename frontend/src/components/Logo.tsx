import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
      <img
        src="/logo.png"
        alt="TongueBridge"
        width={40}
        height={40}
        className="shrink-0 rounded-lg object-contain transition-transform group-hover:scale-105"
      />
      <span className="text-lg font-bold text-heading tracking-tight">
        Tongue<span className="text-brand">Bridge</span>
      </span>
    </Link>
  );
}
