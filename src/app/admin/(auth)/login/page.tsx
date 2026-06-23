"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Suspense } from "react";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const EMAIL_STORAGE_KEY = "cfo-admin-login-email";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/admin";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkSent, setLinkSent] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function finishSignIn(emailForLink: string, href: string) {
    setCompleting(true);
    setError(null);
    try {
      const credential = await signInWithEmailLink(auth, emailForLink, href);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Access denied");
      }

      window.localStorage.removeItem(EMAIL_STORAGE_KEY);
      window.history.replaceState({}, "", "/admin/login");
      router.push(from);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sign-in link is invalid or expired."
      );
      setCompleting(false);
    }
  }

  // Demo mode: plant a fake session cookie so middleware passes, then redirect
  useEffect(() => {
    if (IS_DEMO) {
      document.cookie = "__session=demo; path=/; SameSite=Lax";
      router.replace(from);
      return;
    }

    if (isSignInWithEmailLink(auth, window.location.href)) {
      const emailForLink =
        window.localStorage.getItem(EMAIL_STORAGE_KEY) ?? params.get("email");
      if (emailForLink) {
        finishSignIn(emailForLink, window.location.href);
      } else {
        setError("Sign-in link is invalid or expired.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (IS_DEMO) { router.replace(from); return; }
    setError(null);
    setLoading(true);

    try {
      await sendSignInLinkToEmail(auth, email, {
        url: `${window.location.origin}/admin/login?from=${encodeURIComponent(from)}&email=${encodeURIComponent(email)}`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
      setLinkSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't send sign-in link. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">CFO Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in with a magic link</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {completing ? (
            <p className="text-sm text-gray-600 text-center">Signing you in…</p>
          ) : linkSent ? (
            <p className="text-sm text-gray-600 text-center">
              Check <span className="font-medium text-gray-900">{email}</span> for a
              sign-in link.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}

          {error && (linkSent || completing) && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
