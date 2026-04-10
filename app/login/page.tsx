"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/homework");
      } else {
        const json = await res.json();
        setError(json.error ?? "登入失敗");
      }
    } catch {
      setError("網路錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">WeGoElite</h1>
          <p className="text-lg text-muted-foreground mt-1">小學部門</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="password"
            placeholder="請輸入密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 text-center text-lg"
            autoFocus
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={loading || !password}
          >
            {loading ? "登入中..." : "登入"}
          </Button>
        </form>
      </div>
    </div>
  );
}
