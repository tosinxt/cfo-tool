"use client";

import { useState } from "react";
import { CalderaNav } from "@/components/caldera/nav";
import { CalderaHero } from "@/components/caldera/hero";
import { CalderaStats } from "@/components/caldera/stats";
import { CalderaConnected } from "@/components/caldera/connected";
import { CalderaMarquee } from "@/components/caldera/marquee";
import { CalderaCards } from "@/components/caldera/cards";
import { CalderaCTA } from "@/components/caldera/cta";
import { CalderaFooter } from "@/components/caldera/footer";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGetStarted() {
    if (DEMO_MODE) {
      window.location.href = "/intake/demo-engagement-001?token=demo-token-insecure";
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen flex-col bg-[var(--color-cream)]"
      style={{ fontFamily: "var(--font-af)" }}
    >
      <CalderaNav />
      <CalderaHero onGetStarted={handleGetStarted} loading={loading} />
      <div className="flex flex-col gap-[48px] pb-[80px]">
        <CalderaStats />
        <CalderaMarquee />
        <CalderaConnected />
        <CalderaCards />
        <CalderaCTA onGetStarted={handleGetStarted} loading={loading} error={error} />
      </div>
      <CalderaFooter />
    </main>
  );
}
