import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LanguagesShowcase } from "@/components/landing/LanguagesShowcase";
import { DnaComparison } from "@/components/landing/DnaComparison";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TongueBridge — Learn Any Language The Way YOU Think" },
      { name: "description", content: "TongueBridge analyses your speaking style and teaches you a new language in your own voice. Built on Language DNA technology." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <LanguagesShowcase />
      <DnaComparison />
      <Testimonials />
      <Pricing />
      <Footer />
    </>
  );
}
