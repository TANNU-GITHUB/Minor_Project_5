import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "../Logo";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how" },
  { label: "Languages", href: "#languages" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-muted-ink hover:text-brand transition-colors">
              {l.label}
            </a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="px-5 py-2 rounded-full text-sm font-medium border border-brand text-brand hover:bg-brand-tint transition">
            Log In
          </Link>
          <Link to="/signup" className="px-5 py-2 rounded-full text-sm font-medium bg-brand text-white hover:bg-brand-dark transition">
            Start Free
          </Link>
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="w-6 h-6 text-heading" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 bg-white z-50 p-6 md:hidden"
          >
            <div className="flex items-center justify-between mb-10">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex flex-col gap-6">
              {LINKS.map((l) => (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-2xl font-semibold text-heading">
                  {l.label}
                </a>
              ))}
              <Link to="/login" className="mt-4 px-5 py-3 rounded-full text-center border border-brand text-brand font-medium">Log In</Link>
              <Link to="/signup" className="px-5 py-3 rounded-full text-center bg-brand text-white font-medium">Start Free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
