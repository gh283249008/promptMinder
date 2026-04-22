"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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
    } catch {
      setError("请求失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f172a",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#1e293b",
        padding: "48px",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "16px",
          }}>🔐</div>
          <h1 style={{
            color: "#f8fafc",
            fontSize: "24px",
            fontWeight: "600",
            marginBottom: "8px",
          }}>PromptMinder</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            输入管理员密码访问
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入访问密码"
              autoFocus
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "16px",
                border: "1px solid #334155",
                borderRadius: "8px",
                background: "#0f172a",
                color: "#f8fafc",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#334155"}
            />
          </div>

          {error && (
            <p style={{
              color: "#ef4444",
              fontSize: "14px",
              marginBottom: "16px",
              textAlign: "center",
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              fontWeight: "500",
              background: loading ? "#1e40af" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = "#2563eb"; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = "#3b82f6"; }}
          >
            {loading ? "验证中..." : "进入"}
          </button>
        </form>
      </div>
    </div>
  );
}