"use client";
import { signIn } from "next-auth/react";
import React, { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        {/* Apple (auto light/dark) */}
        <button
          onClick={() => signIn("apple")}
          className="btn btn-apple"
          aria-label="Continue with Apple"
        >
          <span className="btn-ico" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 14 17"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M13.962 13.132c-.326.747-.716 1.416-1.17 2.005-.613.806-1.115 1.36-1.512 1.664-.605.5-1.254.757-1.945.771-.497 0-1.097-.142-1.796-.426-.7-.283-1.341-.424-1.924-.424-.612 0-1.276.141-1.994.424-.718.284-1.287.431-1.708.443-.662.027-1.33-.25-2.006-.829C.565 16.045.019 15.306 0 15.283c.92-.56 1.63-1.29 2.133-2.192.504-.902.757-1.906.757-3.013 0-1.2-.216-2.229-.648-3.087C1.81 5.799 1.084 4.947 0 4.286c.535-.648 1.125-1.155 1.771-1.522.646-.367 1.317-.552 2.012-.552.787 0 1.616.24 2.486.717.87.478 1.59.718 2.162.718.53 0 1.233-.24 2.11-.717.905-.497 1.67-.703 2.295-.616.676.081 1.268.278 1.775.592-.285.403-.577.896-.874 1.478a6.177 6.177 0 0 0-.64 2.69c0 1.223.324 2.37.971 3.438.648 1.07 1.454 1.884 2.418 2.443zM9.27 0c0 .931-.337 1.8-1.01 2.604C7.549 3.422 6.724 3.92 5.83 3.849c-.027-.09-.04-.19-.04-.303 0-.884.38-1.757 1.072-2.546C7.552.196 8.352-.205 9.252 0z" />
            </svg>
          </span>
          <span className="btn-text">Continue with Apple</span>
        </button>

        {/* Google (white button with border per guidelines; suitable for light/dark UIs) */}
        <button
          onClick={() => signIn("google")}
          className="btn btn-google"
          aria-label="Continue with Google"
        >
          <span className="btn-ico" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.27 1.53 7.72 2.81l5.64-5.47C33.64 3.36 29.12 1.5 24 1.5 14.64 1.5 6.69 7.93 3.66 16.02l6.96 5.41C11.79 14.87 17.36 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.1 24.5c0-1.58-.14-3.1-.39-4.57H24v9.13h12.37c-.54 2.77-2.15 5.1-4.56 6.67l7.02 5.45c4.12-3.8 6.47-9.42 6.47-16.68z"/>
              <path fill="#4A90E2" d="M24 47c6.57 0 12.09-2.17 16.12-5.92l-7.02-5.45C30.56 37.9 27.46 38.9 24 38.9c-6.27 0-11.59-4.23-13.48-9.91l-7.02 5.43C7.1 41.73 15 47 24 47z"/>
              <path fill="#FBBC05" d="M10.52 28.99c-.46-1.37-.72-2.83-.72-4.33s.26-2.96.72-4.33L3.56 14.92A22.94 22.94 0 0 0 1 24c0 3.7.9 7.18 2.56 10.08l6.96-5.09z"/>
            </svg>
          </span>
          <span className="btn-text">Continue with Google</span>
        </button>

        {/* GitHub (black works great in both themes) */}
        <button
          onClick={() => signIn("github")}
          className="btn btn-github"
          aria-label="Continue with GitHub"
        >
          <span className="btn-ico" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.52 0 12.34c0 5.46 3.44 10.08 8.21 11.72.6.11.82-.27.82-.6 0-.3-.01-1.1-.02-2.16-3.34.75-4.05-1.67-4.05-1.67-.55-1.43-1.36-1.82-1.36-1.82-1.11-.78.08-.76.08-.76 1.23.09 1.88 1.3 1.88 1.3 1.09 1.9 2.86 1.35 3.56 1.03.11-.81.43-1.35.78-1.66-2.67-.31-5.48-1.37-5.48-6.08 0-1.34.46-2.44 1.22-3.3-.12-.31-.53-1.55.12-3.22 0 0 1-.33 3.28 1.26A11.15 11.15 0 0 1 12 5.84c1.01.01 2.03.14 2.98.4 2.27-1.59 3.27-1.26 3.27-1.26.66 1.67.25 2.91.13 3.22.76.86 1.22 1.96 1.22 3.3 0 4.72-2.82 5.77-5.5 6.08.44.38.83 1.12.83 2.26 0 1.63-.02 2.94-.02 3.34 0 .33.22.71.83.59C20.56 22.42 24 17.8 24 12.34 24 5.52 18.63 0 12 0z"/>
            </svg>
          </span>
          <span className="btn-text">Continue with GitHub</span>
        </button>
      </div>

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
      </div>

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
