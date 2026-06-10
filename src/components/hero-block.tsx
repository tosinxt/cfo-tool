"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";

interface HeroBlockProps {
  onGetStarted?: () => void;
  loading?: boolean;
  error?: string | null;
  isDemo?: boolean;
}

export function HeroBlock({
  onGetStarted,
  loading,
  error,
  isDemo,
}: HeroBlockProps) {
  return (
    <section className="w-full bg-[#f6f4ef] py-6 px-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 h-[calc(100vh-3rem)] min-h-[640px]">
        {/* Main visual card. The headline panel overlaps its bottom-left
            corner; two fixed-radius "notch" circles (in the page's own
            cream tone) sit at the seam so the two shapes read as one
            continuous curve rather than a stacked rectangle-on-rectangle. */}
        <div className="relative h-full">
          <div className="relative h-full overflow-hidden rounded-[28px]">
            <Image
              src="/hero.png"
              alt="A quiet alpine valley at first light — wildflowers in the foreground, a single stone hut against the ridgeline"
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Headline panel */}
          <div className="absolute left-6 bottom-6 sm:left-7 sm:bottom-7 w-[calc(100%-3rem)] sm:w-[27rem] rounded-[20px] bg-white px-7 pt-8 pb-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]">
            {/* notch: two page-colored quarter circles fused to the panel's
                top-right corner, so the seam with the photo above reads as
                one continuous curve rather than a stacked rectangle */}
            <span aria-hidden className="hidden sm:block absolute -top-6 right-0 h-6 w-6 bg-white">
              <span className="block h-full w-full rounded-tl-[20px] bg-[#f6f4ef]" />
            </span>
            <span aria-hidden className="hidden sm:block absolute top-0 -right-6 h-6 w-6 bg-white">
              <span className="block h-full w-full rounded-tl-[20px] bg-[#f6f4ef]" />
            </span>

            <h1 className="font-display text-3xl sm:text-4xl leading-[1.15] tracking-tight text-gray-900 text-balance">
              Building Series&nbsp;A decks that read the way investors think.
            </h1>
          </div>

          {/* Scroll cue */}
          <button
            aria-label="Scroll to learn more"
            className="absolute right-6 bottom-6 sm:right-7 sm:bottom-7 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm text-white transition-colors hover:bg-white/25 z-10"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        {/* Right column — stacked widget cards */}
        <div className="flex flex-row lg:flex-col gap-5">
          {/* Stat badge */}
          <div className="relative flex-1 lg:flex-none lg:h-[200px] rounded-[28px] bg-[#ddd2bf] flex flex-col items-center justify-center text-center">
            <span className="font-display text-5xl tracking-tight text-gray-900">
              5–7
            </span>
            <span className="mt-1.5 text-sm leading-snug text-gray-700">
              Days to your
              <br />
              finished deck
            </span>
            <div className="absolute bottom-4 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === 0 ? "w-4 bg-gray-900" : "w-1.5 bg-gray-900/25"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* CTA card */}
          <div className="relative flex-1 lg:flex-none lg:h-[260px] rounded-[28px] bg-gray-900 px-6 py-6 flex flex-col justify-between overflow-hidden">
            <div>
              <p className="font-display text-xl text-white leading-snug">
                Get your investor-ready deck
              </p>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">
                Delivered in 5–7 business days, with one round of revisions
                included.
              </p>
            </div>
            <Button
              size="lg"
              onClick={onGetStarted}
              disabled={loading}
              className="w-fit gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full px-5"
            >
              {loading ? (
                "Redirecting…"
              ) : isDemo ? (
                <>
                  Try demo
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Get your deck
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <button
              aria-label="Get started"
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {/* Accent card */}
          <a
            href="#sample"
            className="group relative flex-1 lg:flex-none lg:h-[140px] rounded-[28px] bg-indigo-600 px-6 py-6 flex flex-col justify-center overflow-hidden transition-colors hover:bg-indigo-700"
          >
            <p className="text-base leading-snug text-white max-w-[14rem]">
              <span className="font-display italic text-indigo-200">
                See a sample:
              </span>{" "}
              what an investor-ready narrative looks like
            </p>
            <span className="absolute bottom-4 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
        </div>
      </div>

      {error && (
        <p className="mx-auto max-w-7xl mt-3 text-sm text-red-600 px-1">{error}</p>
      )}
    </section>
  );
}
