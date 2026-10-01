"use client";

import { useState } from "react";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

 async function handleChangePassword() {
  if (!password || !confirmPassword) {
    alert("Password wajib diisi");
    return;
  }

  if (password !== confirmPassword) {
    alert("Konfirmasi password tidak sama");
    return;
  }

  try {
    const response = await fetch("/api/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert("Password berhasil diubah!");

      window.location.href = "/employee/dashboard";
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Change password error:", error);
    alert("Terjadi kesalahan saat mengubah password");
  }
}
    
  return (
    <main className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h3 className="mb-3">Ganti Password</h3>

              <p className="text-muted">
                Ini adalah login pertama Anda. Silakan buat password baru.
              </p>

              <div className="mb-3">
                <label className="form-label">
                  Password Baru
                </label>

                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Konfirmasi Password
                </label>

                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Ulangi password baru"
                />
              </div>

              <button
                className="btn btn-primary w-100"
                onClick={handleChangePassword}
              >
                Ganti Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}