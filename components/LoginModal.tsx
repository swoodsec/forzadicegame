"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";

interface Props {
  onSuccess: () => void;
}

export default function LoginModal({ onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setError(data.error ?? "Authentication failed");
        setPassword("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl"
    >
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🔐</div>
        <h2 className="text-xl font-bold text-zinc-100">Admin Access</h2>
        <p className="text-sm text-zinc-500 mt-1">Enter the admin password to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full bg-zinc-800 border border-zinc-700 focus:border-yellow-500 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors"
        />

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-bold rounded-xl transition-colors"
        >
          {loading ? "Verifying..." : "Sign In"}
        </button>
      </form>
    </motion.div>
  );
}
