import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
// import LogoutButton from "@/components/LogoutButton";

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  /*
   * =====================================================
   * STATISTIK DASHBOARD
   * =====================================================
   */

  // Total employee
  const [totalEmployeeRows]: any = await db.execute(
    `SELECT COUNT(*) AS total FROM employees`
  );

  // Employee yang sudah CHECK IN hari ini
  const [hadirRows]: any = await db.execute(
    `SELECT COUNT(DISTINCT employee_id) AS total
     FROM attendances
     WHERE attendance_date = CURDATE()
     AND type = 'CHECK_IN'
     AND status = 'VALID'`
  );

  // Employee yang belum CHECK IN
  const [belumAbsenRows]: any = await db.execute(
    `SELECT COUNT(*) AS total
     FROM employees
     WHERE id NOT IN (
       SELECT DISTINCT employee_id
       FROM attendances
       WHERE attendance_date = CURDATE()
       AND type = 'CHECK_IN'
       AND status = 'VALID'
     )`
  );

  /*
   * Terlambat:
   * CHECK IN setelah jam 08:00
   */
  const [terlambatRows]: any = await db.execute(
    `SELECT COUNT(DISTINCT employee_id) AS total
     FROM attendances
     WHERE attendance_date = CURDATE()
     AND type = 'CHECK_IN'
     AND status = 'VALID'
     AND attendance_time > '08:00:00'`
  );

  /*
   * Attendance terbaru hari ini
   */
  const [attendanceRows]: any = await db.execute(
    `SELECT
        attendances.id,
        employees.name,
        employees.employee_number,
        attendances.type,
        attendances.attendance_time,
        attendances.distance_from_office,
        attendances.status
     FROM attendances
     INNER JOIN employees
        ON attendances.employee_id = employees.id
     WHERE attendances.attendance_date = CURDATE()
     ORDER BY attendances.attendance_time DESC
     LIMIT 8`
  );

  const totalEmployee = totalEmployeeRows[0]?.total || 0;
  const hadir = hadirRows[0]?.total || 0;
  const belumAbsen = belumAbsenRows[0]?.total || 0;
  const terlambat = terlambatRows[0]?.total || 0;

  // Persentase Kehadiran
  const presencePercentage = totalEmployee > 0 
    ? Math.round((hadir / totalEmployee) * 100) 
    : 0;

  return (
    <main className="min-vh-100 bg-light pb-5">
      {/* ================= NAVBAR ================= */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-secondary sticky-top shadow-sm border-bottom border-secondary border-opacity-25">
        <div className="container">
          <Link href="/admin" className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white">
            <span className="bg-none text-white d-inline-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
              <img src="/logo2.png" alt="AttendGuard Logo" />
            </span>
            <span>Attend<span style={{color : '#c48f38'}}>Guard</span></span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#adminNavbar"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="adminNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4 gap-1">
              <li className="nav-item">
                <Link className="nav-link active fw-semibold d-flex align-items-center gap-2" href="/admin">
                  <i className="bi bi-speedometer2"></i> Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white-50 d-flex align-items-center gap-2" href="/admin/employees">
                  <i className="bi bi-people"></i> Employees
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white-50 d-flex align-items-center gap-2" href="/admin/attendance">
                  <i className="bi bi-calendar-check"></i> Attendance
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white-50 d-flex align-items-center gap-2" href="/admin/reports">
                  <i className="bi bi-bar-chart"></i> Reports
                </Link>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-3 pt-2 pt-lg-0 border-top border-lg-0 border-secondary border-opacity-25">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: "38px", height: "38px" }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="d-flex flex-column">
                  <span className="text-white fs-7 fw-semibold lh-1">{user?.name || "Admin"}</span>
                  <span className="text-white-50 fs-8">Administrator</span>
                </div>
              </div>
              {/* <LogoutButton /> */}
            </div>
          </div>
        </div>
      </nav>

      {/* ================= HEADER & HERO BREADCRUMB ================= */}
      <div className="bg-white border-bottom shadow-sm mb-4">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-2 fs-7">
                  <li className="breadcrumb-item"><a href="#" className="text-decoration-none">Home</a></li>
                  <li className="breadcrumb-item active" aria-current="page">Dashboard</li>
                </ol>
              </nav>
              <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <i className="bi bi-grid-1x2-fill text-primary"></i> Dashboard Monitoring
              </h3>
              <p className="text-muted mb-0 fs-7">
                Pantau statistik kehadiran karyawan secara real-time dan kelola aktivitas operasional.
              </p>
            </div>
            
            <div className="d-flex gap-2 align-items-center">
              <div className="bg-light border rounded-3 px-3 py-2 text-end">
                <div className="text-muted fs-8 fw-semibold text-uppercase">Hari Ini</div>
                <div className="fw-bold text-dark fs-7">
                  <i className="bi bi-calendar3 me-1 text-primary"></i>
                  {new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENT CONTAINER ================= */}
      <div className="container">

        {/* PROGRES KEHADIRAN BAR */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <div className="card-body p-4 bg-white">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-2">
              <div>
                <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                  <i className="bi bi-pie-chart-fill text-primary"></i> Tingkat Kehadiran Karyawan
                </h6>
                <small className="text-muted fs-7">Rasio karyawan yang telah check-in terhadap total karyawan terdaftar</small>
              </div>
              <span className="fw-bold text-primary fs-5">{presencePercentage}%</span>
            </div>
            <div className="progress rounded-pill bg-light" style={{ height: "12px" }}>
              <div
                className="progress-bar bg-primary progress-bar-striped progress-bar-animated rounded-pill"
                role="progressbar"
                style={{ width: `${presencePercentage}%` }}
                aria-valuenow={presencePercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        </div>

        {/* ================= STATISTICS CARDS ================= */}
        <div className="row g-3 mb-4">
          
          {/* TOTAL EMPLOYEE */}
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-3 d-flex align-items-center justify-content-center">
                    <i className="bi bi-people-fill fs-4"></i>
                  </div>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1 fs-8">
                    Total
                  </span>
                </div>
                <h6 className="text-muted fw-bold fs-8 text-uppercase mb-1">Total Karyawan</h6>
                <h3 className="fw-extrabold text-dark mb-1">{totalEmployee}</h3>
                <span className="text-muted fs-8">
                  <i className="bi bi-building me-1"></i>Terdaftar di sistem
                </span>
              </div>
            </div>
          </div>

          {/* HADIR */}
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white border-start border-4 border-success">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="rounded-3 bg-success bg-opacity-10 text-success p-3 d-flex align-items-center justify-content-center">
                    <i className="bi bi-check-circle-fill fs-4"></i>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 fs-8">
                    Hadir
                  </span>
                </div>
                <h6 className="text-muted fw-bold fs-8 text-uppercase mb-1">Hadir Hari Ini</h6>
                <h3 className="fw-extrabold text-success mb-1">{hadir}</h3>
                <span className="text-muted fs-8">
                  <i className="bi bi-person-check me-1"></i>Sudah Check-In
                </span>
              </div>
            </div>
          </div>

          {/* BELUM ABSEN */}
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white border-start border-4 border-warning">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="rounded-3 bg-warning bg-opacity-10 text-warning p-3 d-flex align-items-center justify-content-center">
                    <i className="bi bi-hourglass-split fs-4"></i>
                  </div>
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2 py-1 fs-8">
                    Pending
                  </span>
                </div>
                <h6 className="text-muted fw-bold fs-8 text-uppercase mb-1">Belum Absen</h6>
                <h3 className="fw-extrabold text-warning mb-1">{belumAbsen}</h3>
                <span className="text-muted fs-8">
                  <i className="bi bi-exclamation-circle me-1"></i>Belum Check-In
                </span>
              </div>
            </div>
          </div>

          {/* TERLAMBAT */}
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white border-start border-4 border-danger">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="rounded-3 bg-danger bg-opacity-10 text-danger p-3 d-flex align-items-center justify-content-center">
                    <i className="bi bi-clock-history fs-4"></i>
                  </div>
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-1 fs-8">
                    Terlambat
                  </span>
                </div>
                <h6 className="text-muted fw-bold fs-8 text-uppercase mb-1">Terlambat</h6>
                <h3 className="fw-extrabold text-danger mb-1">{terlambat}</h3>
                <span className="text-muted fs-8">
                  <i className="bi bi-alarm me-1"></i>Absen &gt; 08:00
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ================= MAIN CONTENT SECTION ================= */}
        <div className="row g-4">

          {/* ATTENDANCE TABLE CARD */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
              <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-list-task text-primary"></i> Real-Time Activity Log
                  </h6>
                  <small className="text-muted fs-8">Riwayat 8 presensi karyawan terbaru hari ini</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill px-2 py-1 fs-8 d-inline-flex align-items-center gap-1">
                    <span className="spinner-grow spinner-grow-sm" role="status" style={{ width: '6px', height: '6px' }}></span> Live
                  </span>
                  <Link href="/admin/attendance" className="btn btn-sm btn-outline-primary rounded-3 fs-8 fw-semibold">
                    Lihat Semua
                  </Link>
                </div>
              </div>

              <div className="card-body p-0">
                {attendanceRows.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                      <i className="bi bi-inbox fs-2 text-muted"></i>
                    </div>
                    <h6 className="fw-bold text-dark">Belum ada aktivitas presensi</h6>
                    <p className="text-muted fs-7 mb-0">
                      Data absensi masuk atau keluar karyawan hari ini akan otomatis tercatat di sini.
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light fs-8 text-uppercase text-muted">
                        <tr>
                          <th className="ps-4">Karyawan</th>
                          <th>Tipe Absen</th>
                          <th>Waktu</th>
                          <th>Jarak Lokasi</th>
                          <th className="text-end pe-4">Status Validation</th>
                        </tr>
                      </thead>
                      <tbody className="fs-7">
                        {attendanceRows.map((attendance: any) => (
                          <tr key={attendance.id}>
                            <td className="ps-4">
                              <div className="d-flex align-items-center gap-2">
                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center fw-bold text-secondary border" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
                                  {attendance.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-semibold text-dark">{attendance.name}</div>
                                  <div className="text-muted fs-8">{attendance.employee_number}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {attendance.type === "CHECK_IN" ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 fs-8">
                                  <i className="bi bi-box-arrow-in-right me-1"></i> CHECK IN
                                </span>
                              ) : (
                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-1 fs-8">
                                  <i className="bi bi-box-arrow-left me-1"></i> CHECK OUT
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="fw-semibold text-dark">
                                <i className="bi bi-clock me-1 text-muted"></i>
                                {String(attendance.attendance_time).substring(0, 5)}
                              </span>
                            </td>
                            <td>
                              <span className="text-muted fs-8">
                                <i className="bi bi-geo-alt me-1 text-primary"></i>
                                {attendance.distance_from_office ? `${Math.round(attendance.distance_from_office)}m` : '-'}
                              </span>
                            </td>
                            <td className="text-end pe-4">
                              {attendance.status === "VALID" ? (
                                <span className="badge bg-success text-white rounded-pill px-2 py-1 fs-8">
                                  <i className="bi bi-shield-check me-1"></i> Valid
                                </span>
                              ) : (
                                <span className="badge bg-danger text-white rounded-pill px-2 py-1 fs-8">
                                  <i className="bi bi-shield-x me-1"></i> Rejected
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="card-footer bg-white border-top py-3 px-4">
                <div className="d-flex justify-content-between align-items-center fs-8 text-muted">
                  <span>Menampilkan {attendanceRows.length} entri terbaru</span>
                  <span className="d-flex align-items-center gap-1">
                    <i className="bi bi-info-circle"></i> Diperbarui otomatis
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR / QUICK ACTIONS & INFORMASI PANEL */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4">

              {/* QUICK ACTION CARD */}
              <div className="card border-0 shadow-sm rounded-4 bg-white">
                <div className="card-header bg-white border-bottom py-3 px-4">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-lightning-charge-fill text-warning"></i> Quick Actions
                  </h6>
                </div>
                <div className="card-body p-3">
                  <div className="row g-2">
                    <div className="col-6">
                      <Link
                        href="/admin/employees"
                        className="btn btn-outline-primary w-100 p-3 text-start rounded-3 d-flex flex-column justify-content-between gap-2 h-100 border-opacity-25"
                      >
                        <i className="bi bi-people-fill fs-3"></i>
                        <div>
                          <div className="fw-bold fs-7">Karyawan</div>
                          <div className="fs-8 text-muted">Kelola data</div>
                        </div>
                      </Link>
                    </div>

                    <div className="col-6">
                      <Link
                        href="/admin/attendance"
                        className="btn btn-outline-success w-100 p-3 text-start rounded-3 d-flex flex-column justify-content-between gap-2 h-100 border-opacity-25"
                      >
                        <i className="bi bi-calendar-check-fill fs-3"></i>
                        <div>
                          <div className="fw-bold fs-7">Kehadiran</div>
                          <div className="fs-8 text-muted">Rekap harian</div>
                        </div>
                      </Link>
                    </div>

                    <div className="col-6">
                      <Link
                        href="/admin/office"
                        className="btn btn-outline-warning w-100 p-3 text-start rounded-3 d-flex flex-column justify-content-between gap-2 h-100 border-opacity-25"
                      >
                        <i className="bi bi-geo-alt-fill fs-3"></i>
                        <div>
                          <div className="fw-bold fs-7">Lokasi Kantor</div>
                          <div className="fs-8 text-muted">Setting Radius</div>
                        </div>
                      </Link>
                    </div>

                    <div className="col-6">
                      <Link
                        href="/admin/reports"
                        className="btn btn-outline-purple w-100 p-3 text-start rounded-3 d-flex flex-column justify-content-between gap-2 h-100 border-opacity-25 text-indigo border-indigo"
                        style={{ color: "#6610f2", borderColor: "#6610f2" }}
                      >
                        <i className="bi bi-file-earmark-bar-graph-fill fs-3"></i>
                        <div>
                          <div className="fw-bold fs-7">Laporan</div>
                          <div className="fs-8 text-muted">Export PDF/Excel</div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* SYSTEM STATUS WIDGET */}
              <div className="card border-0 shadow-sm rounded-4 bg-white">
                <div className="card-header bg-white border-bottom py-3 px-4">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-cpu-fill text-info"></i> Status Layanan
                  </h6>
                </div>
                <div className="card-body p-4">
                  <ul className="list-group list-group-flush fs-7">
                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-0">
                      <span className="text-muted d-flex align-items-center gap-2">
                        <i className="bi bi-database text-secondary"></i> Database Engine
                      </span>
                      <span className="badge bg-success-subtle text-success rounded-pill">Connected</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-0">
                      <span className="text-muted d-flex align-items-center gap-2">
                        <i className="bi bi-pin-map text-secondary"></i> GPS Location Service
                      </span>
                      <span className="badge bg-success-subtle text-success rounded-pill">Active</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-0">
                      <span className="text-muted d-flex align-items-center gap-2">
                        <i className="bi bi-clock-history text-secondary"></i> Time Synchronization
                      </span>
                      <span className="badge bg-success-subtle text-success rounded-pill">NTP Normal</span>
                    </li>
                  </ul>
                  <hr className="my-2 text-muted opacity-25" />
                  <div className="d-flex align-items-center justify-content-between pt-2 fs-8 text-muted">
                    <span>Versi App: v1.2.0</span>
                    <span className="text-success fw-semibold">● System Normal</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </main>
  );
}