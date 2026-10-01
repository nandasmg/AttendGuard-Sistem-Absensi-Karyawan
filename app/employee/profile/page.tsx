
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

export default async function EmployeeProfilePage() {
  const user = await getCurrentUser();

  // Memastikan hanya EMPLOYEE yang bisa mengakses halaman ini
  if (!user || user.role !== "EMPLOYEE") {
    redirect("/login");
  }

  const userId = String(user.userId);

  // Mengambil data profil karyawan
  const [rows] = await db.execute(
    `
    SELECT
      employee_number,
      name,
      department,
      position,
      phone,
      photo
    FROM employees
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  const employee = (rows as any[])[0];

  if (!employee) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="alert alert-warning">
          Data profil karyawan tidak ditemukan.
        </div>
      </main>
    );
  }

  const employeeName = employee.name || "Karyawan";
  const profilePhoto = employee.photo || "/default-profile.png";

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #eef4ff 0%, #f8faff 50%, #ffffff 100%)",
      }}
    >
      {/* NAVBAR */}
      <nav
        className="navbar navbar-dark shadow-sm"
        style={{
          background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
        }}
      >
        <div className="container py-2">
          <Link
            href="/employee/dashboard"
            className="navbar-brand fw-bold d-flex align-items-center gap-2"
          >
            <span
              className="bg-white text-primary rounded-3 d-flex align-items-center justify-content-center"
              style={{
                width: "40px",
                height: "40px",
                fontSize: "18px",
              }}
            >
              AG
            </span>

            <span>AttendGuard</span>
          </Link>

          <Link
            href="/employee/dashboard"
            className="btn btn-sm btn-outline-light"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="container py-4">
        {/* HEADER */}
        <div className="mb-4">
          <p className="text-primary fw-semibold mb-1">
            EMPLOYEE PROFILE
          </p>

          <h2 className="fw-bold text-dark mb-2">
            Profil Saya 👤
          </h2>

          <p className="text-secondary mb-0">
            Lihat informasi pribadi dan data akun Anda.
          </p>
        </div>

        <div className="row g-4">
          {/* PROFILE SUMMARY */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div
                style={{
                  height: "120px",
                  background:
                    "linear-gradient(135deg, #1d4ed8, #60a5fa)",
                }}
              />

              <div className="card-body text-center px-4 pb-4">
                <div
                  className="mx-auto rounded-circle bg-white shadow d-flex align-items-center justify-content-center overflow-hidden"
                  style={{
                    width: "140px",
                    height: "140px",
                    marginTop: "-70px",
                    position: "relative",
                    border: "5px solid white",
                  }}
                >
                  <img
                    src={profilePhoto}
                    alt={`Foto profil ${employeeName}`}
                    className="w-100 h-100"
                    style={{
                      objectFit: "cover",
                    }}
                  />
                </div>

                <h4 className="fw-bold text-dark mt-3 mb-1">
                  {employeeName}
                </h4>

                <p className="text-secondary mb-2">
                  {employee.position || "Karyawan"}
                </p>

                <span className="badge bg-primary rounded-pill px-3 py-2">
                  EMPLOYEE
                </span>

                <hr className="my-4" />

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-secondary small">
                    Nomor Karyawan
                  </span>

                  <strong className="text-dark small">
                    {employee.employee_number || "-"}
                  </strong>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-secondary small">
                    Departemen
                  </span>

                  <strong className="text-dark small">
                    {employee.department || "-"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* PROFILE DETAILS */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "#dbeafe",
                      color: "#2563eb",
                      fontSize: "22px",
                    }}
                  >
                    👤
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">
                      Data Pribadi
                    </h5>

                    <p className="text-secondary small mb-0">
                      Informasi dasar karyawan.
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    Nama Lengkap
                  </label>

                  <div className="form-control bg-light border-0 rounded-3">
                    {employee.name || "-"}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    Nomor Karyawan
                  </label>

                  <div className="form-control bg-light border-0 rounded-3">
                    {employee.employee_number || "-"}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    Departemen
                  </label>

                  <div className="form-control bg-light border-0 rounded-3">
                    {employee.department || "-"}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    Jabatan
                  </label>

                  <div className="form-control bg-light border-0 rounded-3">
                    {employee.position || "-"}
                  </div>
                </div>

                <div>
                  <label className="form-label text-secondary small fw-semibold">
                    Nomor Telepon
                  </label>

                  <div className="form-control bg-light border-0 rounded-3">
                    {employee.phone || "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* ACCOUNT SECURITY */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "#fef3c7",
                      color: "#d97706",
                      fontSize: "22px",
                    }}
                  >
                    🔐
                  </div>

                  <div>
                    <h5 className="fw-bold mb-1">
                      Keamanan Akun
                    </h5>

                    <p className="text-secondary small mb-0">
                      Kelola keamanan akun Anda.
                    </p>
                  </div>
                </div>

                <div className="bg-light rounded-4 p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary small">
                      Status Akun
                    </span>

                    <span className="badge bg-success rounded-pill">
                      Aktif
                    </span>
                  </div>
                </div>

                <Link
                  href="/employee/change-password"
                  className="btn btn-outline-primary rounded-3 w-100"
                >
                  🔑 Ganti Password
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="row g-3 mt-2">
          <div className="col-md-4">
            <Link
              href="/employee/dashboard"
              className="btn btn-light border shadow-sm rounded-3 w-100 py-3"
            >
              ← Dashboard
            </Link>
          </div>

          <div className="col-md-4">
            <Link
              href="/employee/attendance"
              className="btn btn-primary rounded-3 w-100 py-3"
            >
              📋 Absensi
            </Link>
          </div>

          <div className="col-md-4">
            <Link
              href="/employee/history"
              className="btn btn-light border shadow-sm rounded-3 w-100 py-3"
            >
              📊 Riwayat
            </Link>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center mt-4">
          <small className="text-secondary">
            AttendGuard © 2026 — Sistem Absensi Karyawan
          </small>
        </div>
      </div>
    </main>
  );
}