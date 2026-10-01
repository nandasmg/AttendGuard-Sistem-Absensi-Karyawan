import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

const WORK_START_TIME = "08:00:00";
const DEFAULT_PERIOD = 30;

type AttendanceRow = {
  id: number;
  type: "CHECK_IN" | "CHECK_OUT";
  attendance_date: any;
  attendance_time: any;
  latitude: number | null;
  longitude: number | null;
  distance_from_office: number | null;
  status: "VALID" | "REJECTED";
};

type DayRecord = {
  dateKey: string;
  date: Date;
  checkIn: AttendanceRow | null;
  checkOut: AttendanceRow | null;
  status: "HADIR" | "TERLAMBAT" | "TIDAK_HADIR" | "BELUM_CHECK_OUT" | "LIBUR";
};

function formatDate(date: any) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDay(date: Date) {
  return date.toLocaleDateString("id-ID", { weekday: "long" });
}

function formatTime(time: any) {
  if (!time) return "-";
  if (typeof time === "string") return time.substring(0, 8);
  return String(time).substring(0, 8);
}

function dateKey(value: any) {
  if (typeof value === "string") return value.substring(0, 10);
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).substring(0, 10);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function timeToMinutes(value: any) {
  const text = formatTime(value);
  const parts = text.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function statusLabel(status: DayRecord["status"]) {
  const data = {
    HADIR: {
      label: "Hadir",
      className: "text-bg-success",
      icon: "bi-check-circle-fill",
    },
    TERLAMBAT: {
      label: "Terlambat",
      className: "text-bg-warning",
      icon: "bi-clock-history",
    },
    TIDAK_HADIR: {
      label: "Tidak Hadir",
      className: "text-bg-danger",
      icon: "bi-x-circle-fill",
    },
    BELUM_CHECK_OUT: {
      label: "Belum Check-Out",
      className: "text-bg-primary",
      icon: "bi-box-arrow-right",
    },
    LIBUR: {
      label: "Libur",
      className: "text-bg-secondary",
      icon: "bi-calendar-x-fill",
    },
  } as const;

  return data[status];
}

function periodLabel(period: string) {
  if (period === "7") return "7 Hari Terakhir";
  if (period === "30") return "30 Hari Terakhir";
  if (period === "90") return "3 Bulan Terakhir";
  if (period === "365") return "1 Tahun Terakhir";
  return "Semua Riwayat";
}

export default async function EmployeeHistoryPage({
  searchParams,
}: {
  searchParams?: { period?: string; status?: string };
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "EMPLOYEE") {
    redirect("/login");
  }

  const selectedPeriod = ["7", "30", "90", "365", "all"].includes(
    searchParams?.period || ""
  )
    ? searchParams?.period || "30"
    : "30";

  const selectedStatus = searchParams?.status || "ALL";

  const [employeeRows]: any = await db.execute(
    `
      SELECT id, created_at
      FROM employees
      WHERE user_id = ?
      LIMIT 1
    `,
    [Number(user.userId)]
  );

  if (!employeeRows.length) {
    redirect("/employee/dashboard");
  }

  const employee = employeeRows[0];
  const today = startOfDay(new Date());

  let startDate = today;

  if (selectedPeriod === "all") {
    startDate = startOfDay(new Date(employee.created_at));
  } else {
    startDate = addDays(today, -(Number(selectedPeriod) - 1));
  }

  const [rows]: any = await db.execute(
    `
      SELECT
        attendances.id,
        attendances.type,
        attendances.attendance_date,
        attendances.attendance_time,
        attendances.latitude,
        attendances.longitude,
        attendances.distance_from_office,
        attendances.status
      FROM attendances
      INNER JOIN employees
        ON attendances.employee_id = employees.id
      WHERE employees.user_id = ?
        AND attendances.attendance_date >= ?
        AND attendances.attendance_date <= ?
      ORDER BY
        attendances.attendance_date DESC,
        attendances.attendance_time DESC
    `,
    [
      Number(user.userId),
      startDate.toISOString().substring(0, 10),
      today.toISOString().substring(0, 10),
    ]
  );

  const attendanceRows = rows as AttendanceRow[];
  const byDate = new Map<string, { checkIn: AttendanceRow | null; checkOut: AttendanceRow | null }>();

  for (const attendance of attendanceRows) {
    const key = dateKey(attendance.attendance_date);
    if (!byDate.has(key)) {
      byDate.set(key, { checkIn: null, checkOut: null });
    }

    const current = byDate.get(key)!;

    if (attendance.type === "CHECK_IN") {
      current.checkIn = attendance;
    }

    if (attendance.type === "CHECK_OUT") {
      current.checkOut = attendance;
    }
  }

  const days: DayRecord[] = [];

  for (let current = new Date(startDate); current <= today; current = addDays(current, 1)) {
    const key = dateKey(current);
    const data = byDate.get(key);
    const weekend = isWeekend(current);

    let status: DayRecord["status"] = "TIDAK_HADIR";

    if (weekend) {
      status = "LIBUR";
    } else if (data?.checkIn) {
      status =
        timeToMinutes(data.checkIn.attendance_time) > timeToMinutes(WORK_START_TIME)
          ? "TERLAMBAT"
          : data.checkOut
          ? "HADIR"
          : "BELUM_CHECK_OUT";
    }

    days.push({
      dateKey: key,
      date: new Date(current),
      checkIn: data?.checkIn || null,
      checkOut: data?.checkOut || null,
      status,
    });
  }

  days.reverse();

  const visibleDays =
    selectedStatus === "ALL"
      ? days
      : days.filter((day) => day.status === selectedStatus);

  const totalHadir = days.filter((day) => day.status === "HADIR").length;
  const totalTerlambat = days.filter((day) => day.status === "TERLAMBAT").length;
  const totalTidakHadir = days.filter((day) => day.status === "TIDAK_HADIR").length;
  const totalLibur = days.filter((day) => day.status === "LIBUR").length;
  const totalBelumCheckout = days.filter((day) => day.status === "BELUM_CHECK_OUT").length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef4ff 0%, #f8faff 50%, #ffffff 100%)",
      }}
    >
      <nav
        className="navbar navbar-dark shadow-sm"
        style={{ background: "linear-gradient(135deg, #0f172a, #1d4ed8)" }}
      >
        <div className="container py-2">
          <Link
            href="/employee/dashboard"
            className="navbar-brand fw-bold d-flex align-items-center gap-2"
          >
            <span
              className="bg-white text-primary rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
            >
              AG
            </span>
            <span>AttendGuard</span>
          </Link>

          <Link href="/employee/dashboard" className="btn btn-sm btn-outline-light">
            <i className="bi bi-grid-1x2-fill me-1" aria-hidden="true"></i>
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="container py-4 py-lg-5">
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div
            className="card-body p-4 p-lg-5"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)" }}
          >
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
              <div>
                <div className="text-primary fw-semibold small text-uppercase mb-2">
                  <i className="bi bi-calendar2-check-fill me-2" aria-hidden="true"></i>
                  Attendance Transparency
                </div>
                <h1 className="display-6 fw-bold text-dark mb-2">Riwayat Kehadiran</h1>
                <p className="text-secondary mb-0">
                  Lihat catatan hadir, terlambat, tidak hadir, libur, dan status check-out Anda.
                </p>
              </div>

              <Link href="/employee/attendance" className="btn btn-primary rounded-3 px-4 py-2">
                <i className="bi bi-camera-fill me-2" aria-hidden="true"></i>
                Lakukan Absensi
              </Link>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary small fw-semibold">Hadir</span>
                  <span className="bg-success-subtle text-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                    <i className="bi bi-check-circle-fill fs-5" aria-hidden="true"></i>
                  </span>
                </div>
                <h2 className="fw-bold mb-1">{totalHadir}</h2>
                <small className="text-secondary">Hari hadir normal</small>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary small fw-semibold">Terlambat</span>
                  <span className="bg-warning-subtle text-warning-emphasis rounded-3 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                    <i className="bi bi-clock-history fs-5" aria-hidden="true"></i>
                  </span>
                </div>
                <h2 className="fw-bold mb-1">{totalTerlambat}</h2>
                <small className="text-secondary">Check-in setelah 08:00</small>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary small fw-semibold">Tidak Hadir</span>
                  <span className="bg-danger-subtle text-danger rounded-3 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                    <i className="bi bi-x-circle-fill fs-5" aria-hidden="true"></i>
                  </span>
                </div>
                <h2 className="fw-bold mb-1">{totalTidakHadir}</h2>
                <small className="text-secondary">Hari kerja tanpa check-in</small>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary small fw-semibold">Libur</span>
                  <span className="bg-secondary-subtle text-secondary rounded-3 d-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }}>
                    <i className="bi bi-calendar-x-fill fs-5" aria-hidden="true"></i>
                  </span>
                </div>
                <h2 className="fw-bold mb-1">{totalLibur}</h2>
                <small className="text-secondary">Sabtu dan Minggu</small>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <h5 className="fw-bold mb-1">
                  <i className="bi bi-funnel-fill text-primary me-2" aria-hidden="true"></i>
                  Filter Riwayat
                </h5>
                <p className="text-secondary small mb-0">Tampilan saat ini: {periodLabel(selectedPeriod)}</p>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {["7", "30", "90", "365", "all"].map((period) => (
                  <Link
                    key={period}
                    href={`/employee/history?period=${period}${selectedStatus !== "ALL" ? `&status=${selectedStatus}` : ""}`}
                    className={`btn btn-sm rounded-3 ${selectedPeriod === period ? "btn-primary" : "btn-outline-primary"}`}
                  >
                    {periodLabel(period).replace(" Terakhir", "")}
                  </Link>
                ))}
              </div>
            </div>

            <hr className="my-4" />

            <div className="d-flex flex-wrap gap-2">
              {[
                ["ALL", "Semua", "bi-list-ul"],
                ["HADIR", "Hadir", "bi-check-circle"],
                ["TERLAMBAT", "Terlambat", "bi-clock"],
                ["TIDAK_HADIR", "Tidak Hadir", "bi-x-circle"],
                ["BELUM_CHECK_OUT", "Belum Check-Out", "bi-box-arrow-right"],
                ["LIBUR", "Libur", "bi-calendar-x"],
              ].map(([value, label, icon]) => (
                <Link
                  key={value}
                  href={`/employee/history?period=${selectedPeriod}&status=${value}`}
                  className={`btn btn-sm rounded-3 ${selectedStatus === value ? "btn-dark" : "btn-light border"}`}
                >
                  <i className={`bi ${icon} me-1`} aria-hidden="true"></i>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-body p-0">
            <div className="p-4 border-bottom bg-white">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                <div>
                  <h5 className="fw-bold mb-1">
                    <i className="bi bi-table text-primary me-2" aria-hidden="true"></i>
                    Daftar Kehadiran
                  </h5>
                  <p className="text-secondary small mb-0">
                    Setiap hari kerja ditampilkan, termasuk hari ketika Anda tidak melakukan absensi.
                  </p>
                </div>
                <span className="badge bg-primary rounded-pill px-3 py-2">
                  {visibleDays.length} Hari
                </span>
              </div>
            </div>

            {visibleDays.length === 0 ? (
              <div className="text-center p-5">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 72, height: 72 }}>
                  <i className="bi bi-search fs-2 text-secondary" aria-hidden="true"></i>
                </div>
                <h5 className="fw-bold mt-3">Data Tidak Ditemukan</h5>
                <p className="text-secondary mb-0">Tidak ada data untuk filter yang dipilih.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 text-secondary small">Tanggal</th>
                      <th className="py-3 text-secondary small">Check-In</th>
                      <th className="py-3 text-secondary small">Check-Out</th>
                      <th className="py-3 text-secondary small">Status</th>
                      <th className="py-3 text-secondary small">Lokasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDays.map((day) => {
                      const status = statusLabel(day.status);
                      const location = day.checkIn || day.checkOut;

                      return (
                        <tr key={day.dateKey}>
                          <td className="px-4 py-3">
                            <div className="fw-semibold text-dark">{formatDate(day.date)}</div>
                            <small className="text-secondary">{formatDay(day.date)}</small>
                          </td>

                          <td>
                            {day.checkIn ? (
                              <span className="badge bg-light text-dark border px-3 py-2">
                                <i className="bi bi-box-arrow-in-right text-primary me-1" aria-hidden="true"></i>
                                {formatTime(day.checkIn.attendance_time)}
                              </span>
                            ) : (
                              <span className="text-secondary">—</span>
                            )}
                          </td>

                          <td>
                            {day.checkOut ? (
                              <span className="badge bg-light text-dark border px-3 py-2">
                                <i className="bi bi-box-arrow-right text-success me-1" aria-hidden="true"></i>
                                {formatTime(day.checkOut.attendance_time)}
                              </span>
                            ) : (
                              <span className="text-secondary">—</span>
                            )}
                          </td>

                          <td>
                            <span className={`badge ${status.className} rounded-pill px-3 py-2`}>
                              <i className={`bi ${status.icon} me-1`} aria-hidden="true"></i>
                              {status.label}
                            </span>
                            {day.status === "TERLAMBAT" && day.checkIn && (
                              <div className="small text-secondary mt-1">Setelah {WORK_START_TIME.substring(0, 5)}</div>
                            )}
                          </td>

                          <td>
                            {location ? (
                              <div className="small">
                                <div className="text-dark">
                                  <i className="bi bi-geo-alt-fill text-primary me-1" aria-hidden="true"></i>
                                  {location.distance_from_office !== null && location.distance_from_office !== undefined
                                    ? `${Number(location.distance_from_office).toFixed(2)} m dari kantor`
                                    : "Lokasi tersimpan"}
                                </div>
                                <div className="text-secondary mt-1">
                                  {location.latitude !== null ? Number(location.latitude).toFixed(6) : "-"}, {location.longitude !== null ? Number(location.longitude).toFixed(6) : "-"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-secondary">Tidak ada absensi</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="row g-3 mt-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>
              <div className="card-body p-4">
                <div className="d-flex gap-3 align-items-start">
                  <div className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44 }}>
                    <i className="bi bi-info-circle-fill" aria-hidden="true"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-2">Transparansi Kehadiran</h6>
                    <p className="text-secondary small mb-0">
                      Riwayat ini menampilkan hari kerja tanpa menutup-nutupi tanggal ketika tidak ada check-in. Data waktu dan lokasi berasal dari catatan absensi AttendGuard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="small text-secondary mb-1">Belum Check-Out</div>
                <div className="d-flex align-items-center justify-content-between">
                  <h3 className="fw-bold mb-0">{totalBelumCheckout}</h3>
                  <span className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                    <i className="bi bi-box-arrow-right fs-5" aria-hidden="true"></i>
                  </span>
                </div>
                <div className="small text-secondary mt-2">Hari yang sudah check-in tetapi belum check-out.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mt-3">
          <div className="col-md-4">
            <Link href="/employee/dashboard" className="btn btn-light border shadow-sm rounded-3 w-100 py-3">
              <i className="bi bi-grid-1x2-fill me-2" aria-hidden="true"></i>
              Dashboard
            </Link>
          </div>
          <div className="col-md-4">
            <Link href="/employee/attendance" className="btn btn-primary rounded-3 w-100 py-3">
              <i className="bi bi-camera-fill me-2" aria-hidden="true"></i>
              Lakukan Absensi
            </Link>
          </div>
          <div className="col-md-4">
            <Link href="/employee/profile" className="btn btn-light border shadow-sm rounded-3 w-100 py-3">
              <i className="bi bi-person-circle me-2" aria-hidden="true"></i>
              Profil Saya
            </Link>
          </div>
        </div>

        <div className="text-center mt-4">
          <small className="text-secondary">AttendGuard © 2026 — Sistem Absensi Karyawan</small>
        </div>
      </div>
    </main>
  );
}
