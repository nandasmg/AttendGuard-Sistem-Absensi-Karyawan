import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

export default async function EmployeeDashboard() {
  const user = await getCurrentUser();

  // Memastikan hanya EMPLOYEE yang bisa mengakses halaman ini
  if (!user || user.role !== "EMPLOYEE") {
    redirect("/login");
  }
  const userId = String(user.userId);

  // Mengambil data karyawan
  const [employeeRows] = await db.execute(
    `
    SELECT
      name,
      employee_number,
      department,
      position,
      photo
    FROM employees
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  const employee = (employeeRows as any[])[0];

  // Mengambil data absensi hari ini
  const [attendanceRows] = await db.execute(
    `
    SELECT
      type,
      TIME_FORMAT(attendance_time, '%H:%i:%s') AS attendance_time,
      status
    FROM attendances
    INNER JOIN employees
      ON attendances.employee_id = employees.id
    WHERE employees.user_id = ?
      AND attendances.attendance_date = CURDATE()
    ORDER BY attendances.attendance_time ASC
    `,
    [userId]
  );

  const attendances = attendanceRows as any[];

  const checkIn = attendances.find(
    (attendance) => attendance.type === "CHECK_IN"
  );

  const checkOut = attendances.find(
    (attendance) => attendance.type === "CHECK_OUT"
  );

  let overallStatus = "Belum Absen";
  let statusClass = "secondary";

  if (checkIn && checkOut) {
    overallStatus = "Absensi Selesai";
    statusClass = "success";
  } else if (checkIn) {
    overallStatus = "Sudah Check-In";
    statusClass = "primary";
  }

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const employeeName = employee?.name || "Karyawan";
  const employeeNumber = employee?.employee_number || "-";
  const department = employee?.department || "-";
  const position = employee?.position || "-";

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
                fontSize: "20px",
              }}
            >
              AG
            </span>

            <span>AttendGuard</span>
          </Link>

          <div className="d-flex align-items-center gap-2">
            <span className="text-white small d-none d-md-inline">
              Employee Panel
            </span>

            <Link
              href="/"
              className="btn btn-sm btn-outline-light"
            >
              Keluar
            </Link>
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="container py-4">
        {/* HEADER */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <p className="text-primary fw-semibold mb-1">
              EMPLOYEE DASHBOARD
            </p>

            <h2 className="fw-bold text-dark mb-2">
              Selamat Datang, {employeeName} <i className="bi bi-hand-thumbs-up ms-1"></i>
            </h2>

            <p className="text-secondary mb-0">
              Pantau dan kelola kehadiran Anda melalui AttendGuard.
            </p>
          </div>

          <div className="bg-white rounded-4 shadow-sm px-3 py-2">
            <small className="text-secondary d-block">
              Hari ini
            </small>

            <strong className="text-dark">{today}</strong>
          </div>
        </div>

        {/* EMPLOYEE INFORMATION */}
        <div
          className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
          }}
        >
          <div className="card-body p-4 text-white">
            <div className="row align-items-center g-4">
              <div className="col-md-8">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: "70px",
                      height: "70px",
                      fontSize: "26px",
                    }}
                  >
                    {employeeName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h4 className="fw-bold mb-1">{employeeName}</h4>

                    <p className="mb-1 opacity-75">
                      {position} • {department}
                    </p>

                    <small className="opacity-75">
                      Nomor Karyawan: {employeeNumber}
                    </small>
                  </div>
                </div>
              </div>

              <div className="col-md-4 text-md-end">
                <span className="badge bg-light text-primary px-3 py-2 rounded-pill">
                  Akun Karyawan
                </span>

                <p className="small mt-2 mb-0 opacity-75">
                  Pastikan Anda melakukan absensi sesuai lokasi kantor.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ATTENDANCE SUMMARY */}
        <div className="row g-4 mb-4">
          {/* CHECK IN */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary fw-semibold">
                    Check-In
                  </span>

                  <span
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "42px",
                      height: "42px",
                      background: "#dbeafe",
                      color: "#2563eb",
                      fontSize: "20px",
                    }}
                  >
                    <i className="bi bi-box-arrow-in-right"></i>
                  </span>
                </div>

                <h3 className="fw-bold text-dark mb-1">
                  {checkIn?.attendance_time || "--:--:--"}
                </h3>

                <small className="text-secondary">
                  {checkIn ? "Waktu check-in tercatat" : "Belum check-in"}
                </small>

                <div className="mt-3">
                  <span
                    className={`badge rounded-pill bg-${
                      checkIn ? "success" : "secondary"
                    }`}
                  >
                    {checkIn ? "Berhasil" : "Belum Absen"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CHECK OUT */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary fw-semibold">
                    Check-Out
                  </span>

                  <span
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "42px",
                      height: "42px",
                      background: "#dcfce7",
                      color: "#16a34a",
                      fontSize: "20px",
                    }}
                  >
                    <i className="bi bi-box-arrow-left"></i>
                  </span>
                </div>

                <h3 className="fw-bold text-dark mb-1">
                  {checkOut?.attendance_time || "--:--:--"}
                </h3>

                <small className="text-secondary">
                  {checkOut
                    ? "Waktu check-out tercatat"
                    : "Belum check-out"}
                </small>

                <div className="mt-3">
                  <span
                    className={`badge rounded-pill bg-${
                      checkOut ? "success" : "secondary"
                    }`}
                  >
                    {checkOut ? "Berhasil" : "Belum Absen"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary fw-semibold">
                    Status Hari Ini
                  </span>

                  <span
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "42px",
                      height: "42px",
                      background: "#fef3c7",
                      color: "#d97706",
                      fontSize: "20px",
                    }}
                  >
                    <i className="bi bi-check-lg"></i>
                  </span>
                </div>

                <h4 className="fw-bold text-dark mb-2">
                  {overallStatus}
                </h4>

                <small className="text-secondary">
                  Ringkasan status absensi Anda.
                </small>

                <div className="mt-3">
                  <span className={`badge rounded-pill bg-${statusClass}`}>
                    {overallStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN ATTENDANCE ACTION */}
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "50px",
                      height: "50px",
                      background: "#dbeafe",
                      color: "#2563eb",
                      fontSize: "24px",
                    }}
                  >
                    <i className="bi bi-geo-alt-fill"></i>
                  </div>

                  <div>
                    <h4 className="fw-bold mb-1">
                      Lakukan Absensi
                    </h4>

                    <p className="text-secondary mb-0">
                      Check-in dan check-out menggunakan GPS serta kamera.
                    </p>
                  </div>
                </div>

                <hr />

                <p className="text-secondary">
                  Pastikan Anda berada di area kantor, mengaktifkan lokasi,
                  dan memberikan izin kamera sebelum melakukan absensi.
                </p>

                <Link
                  href="/employee/attendance"
                  className="btn btn-primary btn-lg rounded-3 px-4 d-inline-flex align-items-center gap-2"
                >
                  <span>Mulai Absensi</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
            </div>
          </div>

          {/* QUICK MENU */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">
                  Menu Cepat
                </h5>

                <div className="d-grid gap-2">
                  <Link
                    href="/employee/history"
                    className="btn btn-outline-primary text-start rounded-3 py-3 d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-clipboard-data"></i>
                    <span>Riwayat Kehadiran</span>
                  </Link>

                  <Link
                    href="/employee/profile"
                    className="btn btn-outline-primary text-start rounded-3 py-3 d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-person"></i>
                    <span>Profil Saya</span>
                  </Link>

                  <Link
                    href="/employee/change-password"
                    className="btn btn-outline-secondary text-start rounded-3 py-3 d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-key"></i>
                    <span>Ganti Password</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER INFORMATION */}
        <div className="text-center mt-4">
          <small className="text-secondary">
            AttendGuard © 2026 — Sistem Absensi Karyawan
          </small>
        </div>
      </div>
    </main>
  );
}