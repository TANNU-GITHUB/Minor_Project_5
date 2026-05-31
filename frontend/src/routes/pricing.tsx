import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { createCheckout, UserSession } from "@/lib/api";
import { Navbar } from "@/components/landing/Navbar";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";

function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const userId = UserSession.getId();
      // TODO: replace with real email from auth
      const email = "user@tonguebridge.in";
      const { checkout_url } = await createCheckout(userId, email);
      window.location.href = checkout_url;
    } catch {
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="pt-20">
        <Pricing onUpgrade={handleUpgrade} loading={loading} />
      </div>
      <Footer />
    </>
  );
}

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Pricing — TongueBridge" }] }),
  component: PricingPage,
});
