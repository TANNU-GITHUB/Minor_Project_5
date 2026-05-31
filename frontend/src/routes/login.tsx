import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { HolographicGlobe } from "@/components/HolographicGlobe";
import { UserSession, getLessons } from "@/lib/api";
import { redirectIfOnboarded } from "@/lib/guards";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log In — TongueBridge" }] }),
  beforeLoad: redirectIfOnboarded,
  component: Login,
});

function Login() {
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState("");
  const nav = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim() || "learner@tonguebridge.in";
    UserSession.login(mail);

    try {
      const lessons = await getLessons(UserSession.getId());
      if (lessons.length > 0 && UserSession.getDNA()) {
        UserSession.setOnboardingComplete(true);
        nav({ to: "/dashboard" });
        return;
      }
    } catch {
      /* new or incomplete user */
    }

    nav({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen md:flex">
      <div className="hidden md:flex w-1/2 bg-brand text-white items-center justify-center p-10">
        <HolographicGlobe size={280} />
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Logo />
          <h2 className="mt-6 text-3xl font-extrabold text-heading">Welcome Back</h2>
          <p className="text-body mt-1 text-sm">
            Log in, then choose your languages and record your voice to personalize your plan.
          </p>
          <form className="mt-6 space-y-3" onSubmit={(e) => void handleLogin(e)}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-ink" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-subtle bg-white focus:border-brand focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-ink" />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-subtle bg-white focus:border-brand focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-body">
                <input type="checkbox" className="accent-brand" /> Remember me
              </label>
              <button type="button" onClick={() => setForgot(true)} className="text-brand font-medium">
                Forgot Password?
              </button>
            </div>
            <button
              type="submit"
              className="w-full px-5 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark active:scale-95 transition"
            >
              Log In →
            </button>
          </form>
          <p className="text-center text-sm text-muted-ink mt-5">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-brand font-semibold">
              Sign Up Free
            </Link>
          </p>
        </div>
      </div>

      {forgot && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50"
          onClick={() => setForgot(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full md:max-w-md"
          >
            <h3 className="text-xl font-bold text-heading">Reset Password</h3>
            <p className="text-sm text-body mt-1">Enter your email. We&apos;ll send you a reset link.</p>
            <input
              type="email"
              placeholder="you@example.com"
              className="mt-4 w-full px-4 py-3 rounded-xl border border-border-subtle focus:border-brand outline-none"
            />
            <button type="button" className="mt-4 w-full px-5 py-3 rounded-full bg-brand text-white font-semibold">
              Send Reset Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
