"use client";

import { useEffect, useState } from "react";

export default function OfficeLocationPage() {
  const [office, setOffice] = useState<any>(null);

  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadOffice();
  }, []);

  async function loadOffice() {
    try {
      const response = await fetch("/api/office");
      const data = await response.json();

      if (data.success && data.office) {
        setOffice(data.office);

        setName(data.office.name);
        setLatitude(String(data.office.latitude));
        setLongitude(String(data.office.longitude));
        setRadius(String(data.office.radius));
      }
    } catch (error) {
      console.error(
        "Gagal mengambil lokasi kantor:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Browser tidak mendukung GPS.");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLatitude =
          position.coords.latitude;

        const currentLongitude =
          position.coords.longitude;

        setLatitude(
          currentLatitude.toFixed(7)
        );

        setLongitude(
          currentLongitude.toFixed(7)
        );

        setGettingLocation(false);

        alert(
          "Lokasi berhasil diambil dari GPS."
        );
      },

      (error) => {
        console.error(
          "GPS error:",
          error
        );

        setGettingLocation(false);

        if (error.code === 1) {
          alert(
            "Izin lokasi ditolak. Silakan izinkan akses lokasi di browser."
          );
        } else if (error.code === 2) {
          alert(
            "Lokasi tidak dapat ditemukan."
          );
        } else if (error.code === 3) {
          alert(
            "Pengambilan lokasi terlalu lama."
          );
        } else {
          alert(
            "Gagal mendapatkan lokasi."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  async function handleSave() {
    if (
      !name ||
      !latitude ||
      !longitude ||
      !radius
    ) {
      alert(
        "Semua data wajib diisi."
      );
      return;
    }

    if (
      Number.isNaN(Number(latitude)) ||
      Number.isNaN(Number(longitude))
    ) {
      alert(
        "Latitude atau longitude tidak valid."
      );
      return;
    }

    if (Number(radius) <= 0) {
      alert(
        "Radius harus lebih dari 0 meter."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/office",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            latitude,
            longitude,
            radius,
          }),
        }
      );

      const data =
        await response.json();

      if (data.success) {
        alert(
          "Lokasi kantor berhasil disimpan!"
        );

        await loadOffice();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(
        "Save office error:",
        error
      );

      alert(
        "Terjadi kesalahan saat menyimpan lokasi."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-vh-100 bg-light">

      {/* NAVBAR */}
      <nav
        className="navbar"
        style={{
          background: "#172033",
        }}
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

      <div className="container py-5">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-start mb-4">

          <div>

            <div
              className="d-inline-block px-3 py-2 rounded-pill mb-3"
              style={{
                background: "#e8f0ff",
                color: "#3157a4",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              OFFICE LOCATION
            </div>

            <h2
              className="fw-bold mb-2"
              style={{
                color: "#172033",
              }}
            >
              Office Location
            </h2>

            <p className="text-muted mb-0">
              Atur area yang diperbolehkan
              untuk melakukan absensi.
            </p>

          </div>

          {/* STATUS */}
          <div>

            <span
              className="badge rounded-pill px-3 py-2"
              style={{
                background: "#e8f7ef",
                color: "#198754",
              }}
            >
              ● ACTIVE
            </span>

          </div>

        </div>

        {loading ? (

          <div className="card border-0 shadow-sm">

            <div className="card-body text-center py-5">

              <p className="text-muted mb-0">
                Memuat lokasi kantor...
              </p>

            </div>

          </div>

        ) : (

          <>

            {/* LOCATION PREVIEW */}
            <div
              className="card border-0 shadow-sm mb-4 overflow-hidden"
              style={{
                borderRadius: "18px",
              }}
            >

              <div
                className="p-5 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, #eef4ff, #f8fbff)",
                }}
              >

                <div
                  className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: "90px",
                    height: "90px",
                    background: "#ffffff",
                    boxShadow:
                      "0 8px 25px rgba(49, 87, 164, 0.12)",
                    fontSize: "42px",
                  }}
                >
                  📍
                </div>

                <h4
                  className="fw-bold mb-2"
                  style={{
                    color: "#172033",
                  }}
                >
                  {name ||
                    "Kantor AttendGuard"}
                </h4>

                <p className="text-muted mb-3">
                  OFFICE LOCATION
                </p>

                <div
                  className="d-inline-flex align-items-center px-4 py-2 rounded-pill"
                  style={{
                    background: "#ffffff",
                    color: "#3157a4",
                    boxShadow:
                      "0 4px 15px rgba(0,0,0,0.05)",
                    fontWeight: "600",
                  }}
                >
                  ─── {radius || "0"} meter ───
                </div>

              </div>

            </div>

            {/* COORDINATES */}
            <div className="row g-4 mb-4">

              {/* LATITUDE */}
              <div className="col-md-6">

                <div
                  className="card border-0 shadow-sm h-100"
                  style={{
                    borderRadius: "16px",
                  }}
                >

                  <div className="card-body p-4">

                    <small
                      className="fw-semibold"
                      style={{
                        color: "#6c757d",
                      }}
                    >
                      📍 LATITUDE
                    </small>

                    <h4
                      className="fw-bold mt-3 mb-0"
                      style={{
                        color: "#172033",
                      }}
                    >
                      {latitude || "-"}
                    </h4>

                  </div>

                </div>

              </div>

              {/* LONGITUDE */}
              <div className="col-md-6">

                <div
                  className="card border-0 shadow-sm h-100"
                  style={{
                    borderRadius: "16px",
                  }}
                >

                  <div className="card-body p-4">

                    <small
                      className="fw-semibold"
                      style={{
                        color: "#6c757d",
                      }}
                    >
                      🌐 LONGITUDE
                    </small>

                    <h4
                      className="fw-bold mt-3 mb-0"
                      style={{
                        color: "#172033",
                      }}
                    >
                      {longitude || "-"}
                    </h4>

                  </div>

                </div>

              </div>

            </div>

            {/* OFFICE SETTINGS */}
            <div
              className="card border-0 shadow-sm"
              style={{
                borderRadius: "18px",
              }}
            >

              <div className="card-body p-4 p-md-5">

                <div className="mb-4">

                  <h5
                    className="fw-bold mb-1"
                    style={{
                      color: "#172033",
                    }}
                  >
                    OFFICE SETTINGS
                  </h5>

                  <p className="text-muted mb-0">
                    Atur informasi dan radius
                    geofence kantor.
                  </p>

                </div>

                {/* NAMA KANTOR */}
                <div className="mb-4">

                  <label className="form-label fw-semibold">
                    Nama Kantor
                  </label>

                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    placeholder="Contoh: Kantor AttendGuard"
                  />

                </div>

                {/* COORDINATES */}
                <div className="row">

                  {/* LATITUDE */}
                  <div className="col-md-6 mb-4">

                    <label className="form-label fw-semibold">
                      Latitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-lg"
                      value={latitude}
                      onChange={(e) =>
                        setLatitude(
                          e.target.value
                        )
                      }
                      placeholder="Contoh: 3.xxxxxxx"
                    />

                  </div>

                  {/* LONGITUDE */}
                  <div className="col-md-6 mb-4">

                    <label className="form-label fw-semibold">
                      Longitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-lg"
                      value={longitude}
                      onChange={(e) =>
                        setLongitude(
                          e.target.value
                        )
                      }
                      placeholder="Contoh: 98.xxxxxxx"
                    />

                  </div>

                </div>

                {/* GPS BUTTON */}
                <div className="mb-4">

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={
                      getCurrentLocation
                    }
                    disabled={
                      gettingLocation
                    }
                  >
                    {gettingLocation
                      ? "📍 Mengambil lokasi..."
                      : "📍 Gunakan Lokasi Saya"}
                  </button>

                  <div className="form-text mt-2">
                    Gunakan GPS perangkat untuk
                    mengisi latitude dan longitude
                    secara otomatis.
                  </div>

                </div>

                {/* RADIUS */}
                <div className="mb-4">

                  <label className="form-label fw-semibold">
                    Radius Geofence
                  </label>

                  <div className="input-group input-group-lg">

                    <input
                      type="number"
                      className="form-control"
                      value={radius}
                      onChange={(e) =>
                        setRadius(
                          e.target.value
                        )
                      }
                      min="1"
                    />

                    <span className="input-group-text">
                      meter
                    </span>

                  </div>

                  <div
                    className="mt-3 p-3 rounded-3"
                    style={{
                      background: "#f5f7fa",
                    }}
                  >
                    <small className="text-muted">
                      ℹ️ Employee hanya dapat
                      melakukan attendance ketika
                      berada di dalam radius yang
                      ditentukan.
                    </small>
                  </div>

                </div>

                {/* SAVE BUTTON */}
                <div className="text-end">

                  <button
                    type="button"
                    className="btn btn-primary btn-lg px-4"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving
                      ? "Menyimpan..."
                      : "💾 Simpan Lokasi"}
                  </button>

                </div>

              </div>

            </div>

          </>

        )}

      </div>

    </main>
  );
}