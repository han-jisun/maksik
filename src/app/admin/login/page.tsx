"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.scss";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        router.replace("/admin");
        return;
      }
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "로그인에 실패했습니다.");
    } catch {
      setError("서버에 연결할 수 없습니다.");
    }
    setPending(false);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>관리자 로그인</h1>
      <label className={styles.label} htmlFor="password">
        비밀번호
      </label>
      <input
        id="password"
        type="password"
        className={styles.input}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        autoFocus
        required
      />
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
