
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      alert("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.user.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else if (data.user.role === "EMPLOYEE") {
          if (data.user.first_login) {
            router.push("/employee/change-password");
          } else {
            router.push("/employee/dashboard");
          }
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Terjadi kesalahan saat menghubungkan ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">

        {/* Panel Branding */}
        <section className="branding-panel">
          <div className="branding-content">

            <div className="logo">
            <img  src="/logo2.png" alt="AttendGuard Logo"/>
            </div>

            <h1>
              Attend<span>Guard</span>
            </h1>

            <p className="brand-description">
              Sistem manajemen absensi karyawan
              yang praktis, aman, dan terintegrasi.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Absensi dengan verifikasi lokasi</span>
              </div>

              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Pencatatan kehadiran secara terstruktur</span>
              </div>

              <div className="feature-item">
                <i className="bi bi-check-circle-fill"></i>
                <span>Pengelolaan data karyawan</span>
              </div>
            </div>

            <div className="branding-footer">
              <span>ATTENDGUARD SYSTEM</span>
            </div>

          </div>
        </section>

        {/* Panel Login */}
        <section className="login-panel">
          <div className="login-form-container">

            <div className="mobile-brand">
              

              <h2>AttendGuard</h2>
            </div>

            <div className="login-heading">
              <p className="welcome-text">
                SELAMAT DATANG
              </p>

              <h2>Masuk ke akun Anda</h2>

              <p>
                Silakan masukkan informasi akun untuk
                melanjutkan ke sistem.
              </p>
            </div>

            <div className="login-form">

              {/* Username */}
              <div className="form-field">
                <label htmlFor="username">
                  Username
                </label>

                <div className="input-wrapper">
                  <i className="bi bi-person"></i>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-field">
                <label htmlFor="password">
                  Password
                </label>

                <div className="input-wrapper">
                  <i className="bi bi-lock"></i>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    disabled={loading}
                    autoComplete="current-password"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleLogin();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Button */}
              <button
                type="button"
                className="login-button"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk ke Sistem
                    <i className="bi bi-arrow-right"></i>
                  </>
                )}
              </button>

            </div>

            <div className="security-note">
              <i className="bi bi-shield-lock"></i>

              <span>
                Akses sistem dilindungi dengan autentikasi pengguna.
              </span>
            </div>

            <div className="login-footer">
              © 2026 AttendGuard
            </div>

          </div>
        </section>

      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100vh;
          padding: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f6fb;
          font-family: Arial, Helvetica, sans-serif;
        }

        .login-container {
          width: 100%;
          max-width: 1120px;
          min-height: 650px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(15, 35, 70, 0.12);
        }

        /* Branding Panel */

        .branding-panel {
          position: relative;
          display: flex;
          align-items: center;
          padding: 60px;
          color: #ffffff;
          background:
            linear-gradient(
              145deg,
              #172554 0%,
              #1e40af 55%,
              #2563eb 100%
            );
        }

        .branding-panel::after {
          content: "";
          position: absolute;
          width: 280px;
          height: 280px;
          right: -130px;
          bottom: -100px;
          border: 45px solid rgba(255, 255, 255, 0.06);
          border-radius: 50%;
        }

        .branding-content {
          position: relative;
          z-index: 1;
          max-width: 390px;
        }

        .brand-symbol {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.12);
          font-size: 30px;
        }

        .branding-content h1 {
          margin-bottom: 20px;
          font-size: 44px;
          font-weight: 700;
          letter-spacing: -1.5px;
        }

        .branding-content h1 span {
          color: #c48f38;
        }

        .brand-description {
          max-width: 340px;
          margin-bottom: 38px;
          color: #dbeafe;
          font-size: 15px;
          line-height: 1.8;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 19px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #eff6ff;
          font-size: 13px;
        }

        .feature-item i {
          color: #93c5fd;
          font-size: 16px;
        }

        .branding-footer {
          margin-top: 70px;
          color: #bfdbfe;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        /* Login Panel */

        .login-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 55px;
          background: #ffffff;
        }

        .login-form-container {
          width: 100%;
          max-width: 360px;
        }

        .mobile-brand {
          display: none;
        }

        .login-heading {
          margin-bottom: 34px;
        }

        .welcome-text {
          margin-bottom: 12px;
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        .login-heading h2 {
          margin-bottom: 14px;
          color: #172033;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.7px;
        }

        .login-heading p:last-child {
          margin: 0;
          color: #7b8495;
          font-size: 13px;
          line-height: 1.7;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 23px;
        }

        .form-field label {
          display: block;
          margin-bottom: 9px;
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          height: 50px;
          padding: 0 15px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          transition: all 0.2s ease;
        }

        .input-wrapper:focus-within {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .input-wrapper i {
          margin-right: 12px;
          color: #94a3b8;
          font-size: 17px;
        }

        .input-wrapper input {
          width: 100%;
          height: 100%;
          outline: none;
          border: none;
          background: transparent;
          color: #1e293b;
          font-size: 13px;
        }

        .input-wrapper input::placeholder {
          color: #a1aab8;
        }

        .input-wrapper input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .login-button {
          width: 100%;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 8px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .login-button:hover {
          background: #1d4ed8;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
          transform: translateY(-1px);
        }

        .login-button:active {
          transform: translateY(0);
        }

        .login-button:disabled {
          background: #93b4f4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .login-button i {
          font-size: 16px;
        }

        .loading-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .security-note {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 28px;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.6;
        }

        .security-note i {
          margin-top: 2px;
          color: #64748b;
        }

        .login-footer {
          margin-top: 45px;
          color: #c0c7d2;
          font-size: 11px;
          text-align: center;
        }

        /* Responsive */

        @media (max-width: 850px) {
          .login-page {
            padding: 20px;
          }

          .login-container {
            grid-template-columns: 1fr;
            max-width: 470px;
            min-height: auto;
          }

          .branding-panel {
            display: none;
          }

          .login-panel {
            padding: 45px 35px;
          }

          .mobile-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 38px;
          }

          .small-symbol {
            width: 45px;
            height: 45px;
            margin: 0;
            border-radius: 12px;
            background: #2563eb;
            font-size: 22px;
          }

          .mobile-brand h2 {
            margin: 0;
            color: #172033;
            font-size: 22px;
            font-weight: 700;
          }
        }

        @media (max-width: 450px) {
          .login-page {
            padding: 0;
          }

          .login-container {
            min-height: 100vh;
            border-radius: 0;
          }

          .login-panel {
            padding: 35px 25px;
          }

          .login-heading h2 {
            font-size: 25px;
          }
        
          .logo{
            width: 100%;
            height: auto;
            object-fit: contain;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
        
      `}</style>
    </main>
  );
}