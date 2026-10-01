
    "use client";

    import Link from "next/link";
    import { useEffect, useRef, useState } from "react";

    export default function EmployeeAttendancePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [cameraOpen, setCameraOpen] = useState(false);
    const [selfie, setSelfie] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<
    "success" | "danger" | "info"
    >("info");

    const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    } | null>(null);

    const [locationLoading, setLocationLoading] = useState(false);

    // Mengambil lokasi GPS
    const getLocation = () => {
    setLocationLoading(true);
    setMessage("");

    if (!navigator.geolocation) {
    setMessage("Browser Anda tidak mendukung GPS.");
    setMessageType("danger");
    setLocationLoading(false);
    return;
    }

    navigator.geolocation.getCurrentPosition(
    (position) => {
    setLocation({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    });

    setMessage("Lokasi GPS berhasil didapatkan.");
    setMessageType("success");
    setLocationLoading(false);
    },
    (error) => {
    let errorMessage = "Gagal mendapatkan lokasi GPS.";

    if (error.code === error.PERMISSION_DENIED) {
    errorMessage =
    "Izin lokasi ditolak. Silakan aktifkan izin lokasi browser.";
    } else if (error.code === error.POSITION_UNAVAILABLE) {
    errorMessage = "Lokasi tidak tersedia.";
    } else if (error.code === error.TIMEOUT) {
    errorMessage = "Waktu pengambilan lokasi habis.";
    }

    setMessage(errorMessage);
    setMessageType("danger");
    setLocationLoading(false);
    },
    {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
    }
    );
    };

    // Membuka kamera

    const openCamera = async () => {
    try {
    setMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
    setMessage(
    "Browser tidak mendukung akses kamera atau halaman belum menggunakan koneksi yang aman."
    );
    setMessageType("danger");
    return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
    video: {
    facingMode: "user",
    },
    audio: false,
    });

    streamRef.current = stream;

    // Menampilkan elemen video terlebih dahulu
    setCameraOpen(true);
    } catch (error: any) {
    console.error("Camera error:", error);

    if (error?.name === "NotAllowedError") {
    setMessage(
    "Izin kamera ditolak. Izinkan penggunaan kamera melalui pengaturan browser."
    );
    } else if (error?.name === "NotFoundError") {
    setMessage("Kamera tidak ditemukan pada perangkat ini.");
    } else if (error?.name === "NotReadableError") {
    setMessage(
    "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi."
    );
    } else {
    setMessage(
    "Kamera tidak dapat dibuka. Periksa izin kamera dan coba lagi."
    );
    }

    setMessageType("danger");
    }
    };
    // Menutup kamera
    const closeCamera = () => {
    if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    }

    if (videoRef.current) {
    videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    };

    // Mengambil foto selfie
    const captureSelfie = () => {
    const video = videoRef.current;

    if (!video) {
    setMessage("Kamera belum tersedia.");
    setMessageType("danger");
    return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
    setMessage("Kamera belum siap. Tunggu beberapa saat.");
    setMessageType("danger");
    return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
    setMessage("Gagal memproses foto.");
    setMessageType("danger");
    return;
    }

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    setSelfie(imageData);

    closeCamera();

    setMessage("Foto selfie berhasil diambil.");
    setMessageType("success");
    };

    // Menghapus foto selfie
    const removeSelfie = () => {
    setSelfie(null);
    setMessage("Foto selfie dihapus.");
    setMessageType("info");
    };

    // Mengirim absensi ke API
    const submitAttendance = async (type: "CHECK_IN" | "CHECK_OUT") => {
    setMessage("");

    if (!location) {
    setMessage("Silakan ambil lokasi GPS terlebih dahulu.");
    setMessageType("danger");
    return;
    }

    if (!selfie) {
    setMessage("Silakan ambil foto selfie terlebih dahulu.");
    setMessageType("danger");
    return;
    }

    setLoading(true);

    try {
    const response = await fetch("/api/attendance", {
    method: type === "CHECK_IN" ? "POST" : "PUT",
    headers: {
    "Content-Type": "application/json",
    },
    body: JSON.stringify({
    latitude: location.latitude,
    longitude: location.longitude,
    gps_accuracy: location.accuracy,
    selfie: selfie,
    }),
    });

    const result = await response.json();

    if (!response.ok) {
    setMessage(result.message || "Absensi gagal dilakukan.");
    setMessageType("danger");
    return;
    }

    setMessage(result.message || "Absensi berhasil dilakukan.");
    setMessageType("success");

    setSelfie(null);
    } catch (error) {
    console.error("Attendance error:", error);

    setMessage(
    "Terjadi kesalahan koneksi ke server. Silakan coba lagi."
    );
    setMessageType("danger");
    } finally {
    setLoading(false);
    }
    };

    // Membersihkan kamera ketika halaman ditutup

    useEffect(() => {
    if (!cameraOpen) {
    return;
    }

    const video = videoRef.current;
    const stream = streamRef.current;

    if (video && stream) {
    video.srcObject = stream;

    video.play().catch((error) => {
    console.error("Video play error:", error);
    });
    }
    }, [cameraOpen]);

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
    {/* PAGE HEADER */}
    <div className="mb-4">
    <p className="text-primary fw-semibold mb-1">
    ATTENDANCE SYSTEM
    </p>

    <h2 className="fw-bold text-dark mb-2">
    Absensi Karyawan 📋
    </h2>

    <p className="text-secondary mb-0">
    Lakukan check-in dan check-out menggunakan lokasi GPS serta
    foto selfie.
    </p>
    </div>

    {/* ALERT MESSAGE */}
    {message && (
    <div
    className={`alert alert-${messageType} border-0 shadow-sm rounded-4`}
    role="alert"
    >
    {message}
    </div>
    )}

    <div className="row g-4">
    {/* LEFT COLUMN */}
    <div className="col-lg-7">
    {/* CAMERA CARD */}
    <div className="card border-0 shadow-sm rounded-4 mb-4">
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-3 mb-3">
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
            📷
          </div>

          <div>
            <h5 className="fw-bold mb-1">
              Foto Selfie
            </h5>

            <p className="text-secondary small mb-0">
              Ambil foto sebagai bukti kehadiran.
            </p>
          </div>
        </div>

        {!cameraOpen && !selfie && (
          <div
            className="rounded-4 text-center p-5"
            style={{
              background: "#f8fafc",
              border: "2px dashed #cbd5e1",
            }}
          >
            <div
              style={{
                fontSize: "48px",
              }}
            >
              🤳
            </div>

            <h6 className="fw-bold mt-3">
              Belum ada foto selfie
            </h6>

            <p className="text-secondary small">
              Tekan tombol di bawah untuk membuka kamera.
            </p>

            <button
              type="button"
              className="btn btn-primary rounded-3 px-4"
              onClick={openCamera}
            >
              Buka Kamera
            </button>
          </div>
        )}

        {cameraOpen && (
          <div>
            <div className="rounded-4 overflow-hidden bg-dark">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-100"
                style={{
                display: "block",
                maxHeight: "420px",
                objectFit: "cover",
                transform: "scaleX(-1)",
                }}
              />
            </div>

            <div className="d-flex gap-2 mt-3">
              <button
                type="button"
                className="btn btn-success rounded-3 flex-grow-1"
                onClick={captureSelfie}
              >
                  Ambil Foto
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary rounded-3"
                onClick={closeCamera}
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {selfie && !cameraOpen && (
          <div>
            <div className="position-relative">
              <img
                src={selfie}
                alt="Preview foto selfie"
                className="img-fluid rounded-4 w-100"
                style={{
                  maxHeight: "420px",
                  objectFit: "cover",
                }}
              />

              <span className="position-absolute top-0 end-0 badge bg-success m-3 rounded-pill">
                Foto Siap
              </span>
            </div>

            <div className="d-flex gap-2 mt-3">
              <button
                type="button"
                className="btn btn-primary rounded-3 flex-grow-1"
                onClick={openCamera}
              >
                Ambil Ulang
              </button>

              <button
                type="button"
                className="btn btn-outline-danger rounded-3"
                onClick={removeSelfie}
              >
                Hapus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* GPS CARD */}
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center"
            style={{
              width: "48px",
              height: "48px",
              background: "#dcfce7",
              color: "#16a34a",
              fontSize: "22px",
            }}
          >
            📍
          </div>

          <div>
            <h5 className="fw-bold mb-1">
              Lokasi GPS
            </h5>

            <p className="text-secondary small mb-0">
              Gunakan lokasi aktual perangkat Anda.
            </p>
          </div>
        </div>

        {location ? (
          <div className="bg-light rounded-4 p-3">
            <div className="d-flex justify-content-between mb-2">
              <span className="text-secondary small">
                Latitude
              </span>

              <strong className="small text-dark">
                {location.latitude.toFixed(6)}
              </strong>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span className="text-secondary small">
                Longitude
              </span>

              <strong className="small text-dark">
                {location.longitude.toFixed(6)}
              </strong>
            </div>

            <div className="d-flex justify-content-between">
              <span className="text-secondary small">
                Akurasi
              </span>

              <strong className="small text-dark">
                {location.accuracy.toFixed(2)} meter
              </strong>
            </div>

            <div className="mt-3">
              <span className="badge bg-success rounded-pill">
                Lokasi Ditemukan
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-light rounded-4 p-4 text-center">
            <div style={{ fontSize: "36px" }}>🌐</div>

            <h6 className="fw-bold mt-2">
              Lokasi belum diambil
            </h6>

            <p className="text-secondary small mb-0">
              Ambil lokasi sebelum melakukan absensi.
            </p>
          </div>
        )}

        <button
          type="button"
          className="btn btn-outline-primary rounded-3 w-100 mt-3"
          onClick={getLocation}
          disabled={locationLoading}
        >
          {locationLoading
            ? "Mengambil Lokasi..."
            : "📍 Ambil Lokasi GPS"}
        </button>
      </div>
    </div>
    </div>

    {/* RIGHT COLUMN */}
    <div className="col-lg-5">
    {/* ATTENDANCE ACTION CARD */}
    <div className="card border-0 shadow-sm rounded-4 mb-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-3">
          Konfirmasi Absensi
        </h5>

        <p className="text-secondary small">
          Pastikan foto selfie dan lokasi GPS sudah tersedia
          sebelum menekan tombol absensi.
        </p>

        <div className="bg-light rounded-4 p-3 mb-3">
          <div className="d-flex justify-content-between mb-3">
            <span className="text-secondary small">
              Status Foto
            </span>

            <span
              className={`badge rounded-pill bg-${
                selfie ? "success" : "secondary"
              }`}
            >
              {selfie ? "Siap" : "Belum Siap"}
            </span>
          </div>

          <div className="d-flex justify-content-between">
            <span className="text-secondary small">
              Status GPS
            </span>

            <span
              className={`badge rounded-pill bg-${
                location ? "success" : "secondary"
              }`}
            >
              {location ? "Siap" : "Belum Siap"}
            </span>
          </div>
        </div>

        <div className="d-grid gap-3">
          <button
            type="button"
            className="btn btn-primary btn-lg rounded-3"
            onClick={() => submitAttendance("CHECK_IN")}
            disabled={loading || !location || !selfie}
          >
            {loading ? "Memproses..." : "✓ Check-In"}
          </button>

          <button
            type="button"
            className="btn btn-success btn-lg rounded-3"
            onClick={() => submitAttendance("CHECK_OUT")}
            disabled={loading || !location || !selfie}
          >
            {loading ? "Memproses..." : "✓ Check-Out"}
          </button>
        </div>

        <div className="alert alert-warning small mt-3 mb-0 rounded-3">
          Pastikan Anda melakukan absensi dari area kantor yang
          telah ditentukan oleh administrator.
        </div>
      </div>
    </div>

    {/* INSTRUCTION CARD */}
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-3">
          Panduan Absensi
        </h5>

        <div className="d-flex gap-3 mb-3">
          <span className="badge bg-primary rounded-circle align-self-start">
            1
          </span>

          <p className="text-secondary small mb-0">
            Aktifkan izin kamera pada browser.
          </p>
        </div>

        <div className="d-flex gap-3 mb-3">
          <span className="badge bg-primary rounded-circle align-self-start">
            2
          </span>

          <p className="text-secondary small mb-0">
            Ambil foto selfie dengan jelas.
          </p>
        </div>

        <div className="d-flex gap-3 mb-3">
          <span className="badge bg-primary rounded-circle align-self-start">
            3
          </span>

          <p className="text-secondary small mb-0">
            Ambil lokasi GPS perangkat.
          </p>
        </div>

        <div className="d-flex gap-3">
          <span className="badge bg-primary rounded-circle align-self-start">
            4
          </span>

          <p className="text-secondary small mb-0">
            Tekan tombol Check-In atau Check-Out.
          </p>
        </div>
      </div>
    </div>
    </div>
    </div>

    {/* BACK BUTTON */}
    <div className="text-center mt-4">
    <Link
    href="/employee/dashboard"
    className="btn btn-outline-secondary rounded-3 px-4"
    >
    ← Kembali ke Dashboard
    </Link>
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