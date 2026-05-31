import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, User, Lock, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { HolographicGlobe } from "@/components/HolographicGlobe";
import { UserSession } from "@/lib/api";
import { redirectIfOnboarded } from "@/lib/guards";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign Up — TongueBridge" }] }),
  beforeLoad: redirectIfOnboarded,
  component: Signup,
});

const QUOTES = [
  "TongueBridge made Spanish feel like home in 3 weeks. — Priya",
  "The DNA analysis blew my mind. — Arjun",
  "Every day teaches something new — in my voice. — Kavya",
];

function Signup() {
  const [show, setShow] = useState(false);
  const [qi, setQi] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const nav = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim() || "learner@tonguebridge.in";
    UserSession.login(mail, name.trim() || "Learner");
    UserSession.setOnboardingComplete(false);
    localStorage.removeItem("tb_dna");
    nav({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen md:flex">
      <div className="hidden md:flex w-1/2 bg-brand text-white flex-col items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <HolographicGlobe size={280} />
        <div
          className="relative mt-10 text-center max-w-md italic text-white/90"
          key={qi}
          onAnimationEnd={() => setTimeout(() => setQi((q) => (q + 1) % QUOTES.length), 4000)}
        >
          &ldquo;{QUOTES[qi]}&rdquo;
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Logo />
          <h2 className="mt-6 text-3xl font-extrabold text-heading">Create Your Account</h2>
          <p className="text-body mt-1 text-sm">
            Next: pick languages you know & want to learn, then record your voice.
          </p>
          <form className="mt-6 space-y-3" onSubmit={handleSignup}>
            <Field icon={User} placeholder="Full Name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            <Field icon={Mail} placeholder="Email Address" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
            <div className="relative">
              <Field icon={Lock} placeholder="Password" type={show ? "text" : "password"} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" className="w-full px-5 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark active:scale-95 transition">
              Continue → Choose Languages
            </button>
          </form>
          <p className="text-center text-sm text-muted-ink mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-brand font-semibold">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  ...props
}: React.ComponentProps<"input"> & { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-ink" />
      <input
        {...props}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-subtle bg-white text-body focus:border-brand focus:outline-none focus:shadow-[0_0_0_4px_rgba(15,110,86,0.12)]"
      />
    </div>
  );
}
