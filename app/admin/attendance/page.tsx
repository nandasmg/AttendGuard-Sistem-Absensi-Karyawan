"use client";

import { useEffect, useState } from "react";

export default function AdminAttendancePage() {
  const [attendanceRows, setAttendanceRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
      const response = await fetch("/api/admin/attendance");
      const data = await response.json();

      if (data.success) {
        setAttendanceRows(data.attendances);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Gagal mengambil attendance:", error);
    } finally {
      setLoading(false);
    }
  }

  function openSelfie(
    selfie: string,
    employeeName: string
  ) {
    setSelectedSelfie(selfie);
    setSelectedEmployee(employeeName);
  }

  function closeSelfie() {
    setSelectedSelfie(null);
    setSelectedEmployee("");
  }

  return (
    <main className="min-vh-100 bg-light">

      {/* NAVBAR */}
      <nav
        className="navbar"
        style={{ background: "#172033" }}
      >
        <div className="container">

          <a
            href="/admin/dashboard"
            className="navbar-brand text-white fw-bold"
          >
            AttendGuard
          </a>

          <a
            href="/admin/dashboard"
            className="btn btn-outline-light btn-sm"
          >
            ← Dashboard
          </a>

        </div>
      </nav>

      {/* CONTENT */}
      <div className="container py-5">

        {/* HEADER */}
        <div className="mb-4">

          <div
            className="d-inline-block px-3 py-2 rounded-pill mb-3"
            style={{
              background: "#e8f0ff",
              color: "#3157a4",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            ATTENDANCE MONITORING
          </div>

          <h2
            className="fw-bold mb-2"
            style={{ color: "#172033" }}
          >
            Data Attendance
          </h2>

          <p className="text-muted mb-0">
            Pantau seluruh aktivitas check-in dan
            check-out employee.
          </p>

        </div>

        {/* TABLE CARD */}
        <div
          className="card border-0 shadow-sm"
          style={{
            borderRadius: "16px",
          }}
        >

          <div className="card-body p-4">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>

                <h5
                  className="fw-bold mb-1"
                  style={{ color: "#172033" }}
                >
                  Riwayat Attendance
                </h5>

                <small className="text-muted">
                  Total {attendanceRows.length} data attendance
                </small>

              </div>

              <span
                className="badge rounded-pill px-3 py-2"
                style={{
                  background: "#e8f7ef",
                  color: "#198754",
                }}
              >
                ● DATA DATABASE
              </span>

            </div>

            {/* LOADING */}
            {loading ? (

              <div className="text-center py-5">

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                />

                <p className="text-muted mb-0">
                  Memuat data attendance...
                </p>

              </div>

            ) : attendanceRows.length === 0 ? (

              /* EMPTY */
              <div className="text-center py-5">

                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: "70px",
                    height: "70px",
                    background: "#e8f0ff",
                    fontSize: "30px",
                  }}
                >
                  📋
                </div>

                <h5 className="fw-bold">
                  Belum ada attendance
                </h5>

                <p className="text-muted mb-0">
                  Belum terdapat data absensi employee
                  di database.
                </p>

              </div>

            ) : (

              /* TABLE */
              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead>

                    <tr>
                      <th>No</th>
                      <th>Employee</th>
                      <th>Tanggal</th>
                      <th>Jam</th>
                      <th>Tipe</th>
                      <th>GPS</th>
                      <th>Jarak</th>
                      <th>Status</th>
                      <th>Selfie</th>
                    </tr>

                  </thead>

                  <tbody>

                    {attendanceRows.map(
                      (attendance: any, index: number) => (

                        <tr key={attendance.id}>

                          {/* NO */}
                          <td>
                            {index + 1}
                          </td>

                          {/* EMPLOYEE */}
                          <td>

                            <div className="fw-semibold">
                              {attendance.name}
                            </div>

                            <small className="text-muted">
                              {attendance.employee_number}
                            </small>

                            <br />

                            <small className="text-muted">
                              {attendance.department || "-"}
                            </small>

                          </td>

                          {/* DATE */}
                          <td>
                            {String(
                              attendance.attendance_date
                            )}
                          </td>

                          {/* TIME */}
                          <td className="fw-semibold">
                            {String(
                              attendance.attendance_time
                            ).substring(0, 8)}
                          </td>

                          {/* TYPE */}
                          <td>

                            {attendance.type ===
                            "CHECK_IN" ? (

                              <span
                                className="badge rounded-pill px-3 py-2"
                                style={{
                                  background: "#e8f7ef",
                                  color: "#198754",
                                }}
                              >
                                CHECK IN
                              </span>

                            ) : (

                              <span
                                className="badge rounded-pill px-3 py-2"
                                style={{
                                  background: "#fdecec",
                                  color: "#dc3545",
                                }}
                              >
                                CHECK OUT
                              </span>

                            )}

                          </td>

                          {/* GPS */}
                          <td>

                            <small>

                              {Number(
                                attendance.latitude
                              ).toFixed(6)}

                              <br />

                              {Number(
                                attendance.longitude
                              ).toFixed(6)}

                            </small>

                          </td>

                          {/* DISTANCE */}
                          <td>

                            {attendance.distance_from_office !==
                            null
                              ? `${Number(
                                  attendance.distance_from_office
                                ).toFixed(0)} m`
                              : "-"}

                          </td>

                          {/* STATUS */}
                          <td>

                            {attendance.status ===
                            "VALID" ? (

                              <span className="badge bg-success-subtle text-success">
                                VALID
                              </span>

                            ) : (

                              <span className="badge bg-danger-subtle text-danger">
                                REJECTED
                              </span>

                            )}

                          </td>

                          {/* SELFIE */}
                          <td>

                            {attendance.selfie ? (

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  openSelfie(
                                    attendance.selfie,
                                    attendance.name
                                  )
                                }
                              >
                                📷 Lihat Foto
                              </button>

                            ) : (

                              <span className="text-muted">
                                -
                              </span>

                            )}

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>

      {/* SELFIE MODAL */}
      {selectedSelfie && (

        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{
            backgroundColor:
              "rgba(0, 0, 0, 0.65)",
          }}
          onClick={closeSelfie}
        >

          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-content border-0 shadow">

              {/* HEADER */}
              <div className="modal-header">

                <div>

                  <h5 className="modal-title fw-bold">
                    Selfie Attendance
                  </h5>

                  <small className="text-muted">
                    {selectedEmployee}
                  </small>

                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeSelfie}
                />

              </div>

              {/* PHOTO */}
              <div className="modal-body text-center p-4">

                <img
                  src={selectedSelfie}
                  alt={`Selfie ${selectedEmployee}`}
                  className="img-fluid rounded"
                  style={{
                    maxHeight: "500px",
                    objectFit: "contain",
                  }}
                />

              </div>

              {/* FOOTER */}
              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeSelfie}
                >
                  Tutup
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}