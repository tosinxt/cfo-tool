"use client";

import { useState } from "react";

const links = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "What you get", href: "/#what-you-get" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/#faq" },
];

export function CalderaNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Fixed pill ──────────────────────────────────────────── */}
      <div
        className="fixed left-0 right-0 top-4 z-50 flex justify-center px-4"
        style={{ border: "none" }}
      >
        <nav
          aria-label="Main navigation"
          className="flex w-full items-center rounded-[50px]"
          style={{
            maxWidth: "680px",
            background: "rgba(18, 18, 26, 0.60)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.07)",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-af)",
          }}
        >
          {/* Logo */}
          <a
            href="/"
            className="flex shrink-0 items-center rounded-[50px] px-5 py-2.5 transition-opacity hover:opacity-80"
            style={{ border: "none", outline: "none", textDecoration: "none" }}
          >
            <span
              className="text-[18px] font-[400] leading-none tracking-[-0.36px] text-white"
              style={{
                fontFamily: "var(--font-ppmondwest)",
                fontFeatureSettings: '"liga" 0',
              }}
            >
              Pitch<span style={{ color: "var(--color-slate-cyan)" }}>Ready</span>
            </span>
          </a>

          {/* Desktop links — hidden on mobile */}
          <div
            className="hidden flex-1 items-center justify-center gap-0.5 sm:flex"
            style={{ border: "none" }}
          >
            <div
              className="mx-2 self-stretch"
              style={{
                width: "1px",
                background: "rgba(255,255,255,0.09)",
                margin: "8px 0",
                border: "none",
              }}
            />
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-[50px] px-3.5 py-2 text-[14px] font-[400] leading-none text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
                style={{ border: "none", outline: "none", textDecoration: "none" }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden shrink-0 items-center px-3 py-2 sm:flex" style={{ border: "none" }}>
            <div
              className="mr-2 self-stretch"
              style={{
                width: "1px",
                background: "rgba(255,255,255,0.09)",
                margin: "8px 0",
                border: "none",
              }}
            />
            <a
              href="#get-started"
              className="flex items-center gap-1.5 rounded-[50px] px-4 py-[7px] text-[13px] font-[500] leading-none transition-all duration-150"
              style={{
                color: "var(--color-slate-cyan)",
                boxShadow: "inset 0 0 0 1px rgba(0,174,239,0.38)",
                background: "rgba(0,174,239,0.09)",
                border: "none",
                outline: "none",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "rgba(0,174,239,0.17)";
                el.style.boxShadow = "inset 0 0 0 1px rgba(0,174,239,0.65), 0 0 14px rgba(0,174,239,0.22)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "rgba(0,174,239,0.09)";
                el.style.boxShadow = "inset 0 0 0 1px rgba(0,174,239,0.38)";
              }}
            >
              Get Started <span className="opacity-60">→</span>
            </a>
          </div>

          {/* Mobile right side */}
          <div
            className="ml-auto flex shrink-0 items-center gap-2 px-3 py-2 sm:hidden"
            style={{ border: "none" }}
          >
            <a
              href="#get-started"
              className="rounded-[50px] px-3.5 py-[7px] text-[13px] font-[500] leading-none"
              style={{
                color: "var(--color-slate-cyan)",
                boxShadow: "inset 0 0 0 1px rgba(0,174,239,0.38)",
                background: "rgba(0,174,239,0.09)",
                border: "none",
                outline: "none",
                textDecoration: "none",
              }}
            >
              Get Started
            </a>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="flex h-[34px] w-[34px] flex-col items-center justify-center gap-[5px] rounded-full transition-colors"
              style={{
                background: open ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.11)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span
                className="block h-[1.5px] w-[14px] rounded-full bg-white"
                style={{
                  transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
                  transform: open ? "translateY(6.5px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="block h-[1.5px] w-[14px] rounded-full bg-white"
                style={{
                  transition: "opacity 160ms ease",
                  opacity: open ? 0 : 1,
                }}
              />
              <span
                className="block h-[1.5px] w-[14px] rounded-full bg-white"
                style={{
                  transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
                  transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </nav>
      </div>

      {/* ── Mobile dropdown ─────────────────────────────────────── */}
      <div
        className="fixed left-4 right-4 z-40 overflow-hidden rounded-[20px] sm:hidden"
        style={{
          top: "70px",
          background: "rgba(12, 12, 20, 0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.09), 0 12px 40px rgba(0,0,0,0.36)",
          border: "none",
          maxHeight: open ? "360px" : "0px",
          transition: "max-height 300ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="flex flex-col px-2 py-3" style={{ border: "none" }}>
          {links.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-[12px] px-4 py-3.5 text-[15px] font-[400] leading-none text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white active:bg-white/[0.09]"
              style={{
                fontFamily: "var(--font-af)",
                border: "none",
                outline: "none",
                textDecoration: "none",
                borderBottom: i < links.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              {l.label}
            </a>
          ))}

          <div className="px-2 pb-1 pt-2" style={{ border: "none" }}>
            <a
              href="#get-started"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-[12px] py-3.5 text-[15px] font-[500] leading-none transition-colors"
              style={{
                color: "var(--color-slate-cyan)",
                background: "rgba(0,174,239,0.10)",
                boxShadow: "inset 0 0 0 1px rgba(0,174,239,0.28)",
                fontFamily: "var(--font-af)",
                border: "none",
                outline: "none",
                textDecoration: "none",
              }}
            >
              Get Started →
            </a>
          </div>
        </div>
      </div>

      {/* Tap outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-30 sm:hidden"
          onClick={() => setOpen(false)}
          style={{ border: "none" }}
        />
      )}
    </>
  );
}
