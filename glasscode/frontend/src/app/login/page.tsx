"use client";
import { signIn } from 'next-auth/react';
import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError('Invalid email or password');
      }
    } catch {
      setError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter a name for guest mode');
      return;
    }
    try {
      localStorage.setItem('guestUser', JSON.stringify({ name: guestName.trim() }));
      setError(null);
    } catch {
      setError('Unable to store guest profile');
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
        <button
          className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800"
          onClick={() => signIn('apple')}
        >
          Continue with Apple
        </button>
        <button
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => signIn('google')}
        >
          Continue with Google
        </button>
        <button
          className="w-full py-2 px-4 bg-gray-900 text-white rounded hover:bg-gray-800"
          onClick={() => signIn('github')}
        >
          Continue with GitHub
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
            {loading ? 'Signing in…' : 'Sign in'}
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
        <p className="text-xs text-gray-500 mt-2">Guest mode stores your name in localStorage only on this device.</p>
      </div>
    </div>
  );
}