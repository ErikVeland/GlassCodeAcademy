"use client";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Create your account</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Choose a provider to create an account. You can also use guest mode on the login page.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => signIn("github")}
          className="w-full py-2 px-4 bg-gray-900 text-white rounded hover:bg-black"
        >
          Continue with GitHub
        </button>
        <button
          onClick={() => signIn("google")}
          className="w-full py-2 px-4 bg-white text-gray-900 border rounded hover:bg-gray-100"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn("apple")}
          className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800"
        >
          Continue with Apple
        </button>
      </div>
    </div>
  );
}