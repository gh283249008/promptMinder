"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/prompts");
      router.refresh();
    } else {
      setError("密码错误");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Prompt Minder</h1>
        <p className="text-sm text-gray-500 text-center mb-8">管理员登录</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入管理员密码"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-center"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors font-medium"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
