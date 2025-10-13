"use client";
import { signIn } from "next-auth/react";
import React, { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }>>({});

  useEffect(() => {
    // Fetch configured auth providers from NextAuth
    const loadProviders = async () => {
      try {
        const res = await fetch("/api/auth/providers");
        const data = await res.json();
        setProviders(data || {});
      } catch (e) {
        // Silently ignore; credentials/guest will still be available
        console.warn("Failed to load auth providers", e);
      }
    };
    loadProviders();
  }, []);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
      }
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError("Please enter a name for guest mode");
      return;
    }
    try {
      localStorage.setItem(
        "guestUser",
        JSON.stringify({ name: guestName.trim() })
      );
      setError(null);
    } catch {
      setError("Unable to store guest profile");
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>

      {error && (
        <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Dynamically render available OAuth providers */}
        {Object.values(providers)
          .filter(p => p.id !== "credentials")
          .map(p => (
            <button
              key={p.id}
              onClick={() => signIn(p.id)}
              className={`btn ${p.id === "github" ? "btn-github" : p.id === "apple" ? "btn-apple" : "btn-google"}`}
              aria-label={`Continue with ${p.name}`}
            >
              <span className="btn-ico" aria-hidden="true">
                {/* Minimal icons for popular providers; fallback to initial */}
                {p.id === "apple" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.365 1.43c-.887.52-1.654 1.387-1.517 2.435 1.048.084 2.12-.532 2.733-1.37.571-.788.987-1.895.781-2.995-.834.03-1.732.415-1.997.93zm4.348 8.09c-2.365-.142-3.32 1.324-4.298 1.324-.979 0-2.302-1.282-3.806-1.247-1.962.056-3.772 1.148-4.77 2.903-2.042 3.54-.525 8.797 1.45 11.685.957 1.376 2.114 2.92 3.65 2.866 1.466-.057 2.018-.926 3.789-.926 1.771 0 2.269.926 3.822.898 1.584-.027 2.586-1.41 3.535-2.803 1.06-1.54 1.5-3.03 1.528-3.106-.033-.014-2.936-1.126-2.969-4.46-.028-2.81 2.29-4.088 2.397-4.152-1.311-1.92-3.345-2.681-3.328-2.692z"/></svg>
                ) : p.id === "github" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.37 0 0 5.52 0 12.34c0 5.46 3.44 10.08 8.21 11.72.6.11.82-.27.82-.6 0-.3-.01-1.1-.02-2.16-3.34.75-4.05-1.67-4.05-1.67-.55-1.43-1.36-1.82-1.36-1.82-1.11-.78.08-.76.08-.76 1.23.09 1.88 1.3 1.88 1.3 1.09 1.9 2.86 1.35 3.56 1.03.11-.81.43-1.35.78-1.66-2.67-.31-5.48-1.37-5.48-6.08 0-1.34.46-2.44 1.22-3.3-.12-.31-.53-1.55.12-3.22 0 0 1-.33 3.28 1.26A11.15 11.15 0 0 1 12 5.84c1.01.01 2.03.14 2.98.4 2.27-1.59 3.27-1.26 3.27-1.26.66 1.67.25 2.91.13 3.22.76.86 1.22 1.96 1.22 3.3 0 4.72-2.82 5.77-5.5 6.08.44.38.83 1.12.83 2.26 0 1.63-.02 2.94-.02 3.34 0 .33.22.71.83.59C20.56 22.42 24 17.8 24 12.34 24 5.52 18.63 0 12 0z"/></svg>
                ) : (
                  // Google or other providers: use simple G icon placeholder
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><text x="6" y="16" fontSize="12" fontFamily="system-ui">{p.name[0]}</text></svg>
                )}
              </span>
              <span className="btn-text">Continue with {p.name}</span>
            </button>
          ))}
      </div>

      {providers["credentials"] && (
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-3">Email and Password</h2>
          <form onSubmit={handleCredentials} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            This demo credentials sign-in works only for preconfigured users.
          </p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-medium mb-3">Continue without login</h2>
        <form onSubmit={handleGuest} className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full border rounded p-2"
            required
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
          >
            Continue as guest
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Guest mode stores your name in localStorage only on this device.
        </p>
      </div>

      {/* Theme-aware button styles (no external CSS required) */}
      <style jsx>{`
        .btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 500;
          line-height: 1.2;
          transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          border: 1px solid transparent;
        }
        .btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
        .btn-ico {
          display: inline-flex;
        }

        /* Apple: light = white button with black border/text; dark = black button with white text */
        .btn-apple {
          background: #000;
          color: #fff;
          border-color: #000;
        }
        .btn-apple:hover { background: #111; border-color: #111; }
        @media (prefers-color-scheme: light) {
          .btn-apple {
            background: #fff;
            color: #000;
            border-color: #000;
          }
          .btn-apple:hover { background: #f6f6f6; }
        }

        /* Google: white with subtle border in both themes (per Google guidelines) */
        .btn-google {
          background: #fff;
          color: #202124;
          border-color: #dadce0;
        }
        .btn-google:hover { background: #f8f9fa; }
        @media (prefers-color-scheme: dark) {
          .btn-google {
            background: #fff;
            color: #1f1f1f;
            border-color: #3c4043;
          }
          .btn-google:hover { background: #f0f0f0; }
        }

        /* GitHub: black button fits both themes */
        .btn-github {
          background: #24292f;
          color: #fff;
          border-color: #24292f;
        }
        .btn-github:hover { background: #1f2429; border-color: #1f2429; }
      `}</style>
    </div>
  );
}
