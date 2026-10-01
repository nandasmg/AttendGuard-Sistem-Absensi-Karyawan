"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setUsername("");
    setPassword("");
    setEmployeeNumber("");
    setName("");
    setDepartment("");
    setPosition("");
    setPhone("");
    setPhoto(null);
  }

  function handleToggleForm() {
    if (showForm) {
      resetForm();
      setShowForm(false);
    } else {
      resetForm();
      setShowForm(true);
    }
  }

  async function handleAddEmployee() {
    try {
      // Mode EDIT
      if (editingId !== null) {
        const response = await fetch(`/api/employees/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_number: employeeNumber,
            name,
            department,
            position,
            phone,
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert("Data karyawan berhasil diperbarui!");
          resetForm();
          setShowForm(false);
          loadEmployees();
        } else {
          alert(data.message || "Gagal memperbarui karyawan.");
        }
        return;
      }

      // Mode TAMBAH
      if (!username || !password || !employeeNumber || !name) {
        alert("Mohon isi field utama (Username, Password, No. Karyawan, Nama)!");
        return;
      }

      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("employee_number", employeeNumber);
      formData.append("name", name);
      formData.append("department", department);
      formData.append("position", position);
      formData.append("phone", phone);

      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch("/api/employees", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert("Karyawan baru berhasil ditambahkan!");
        resetForm();
        setShowForm(false);
        loadEmployees();
      } else {
        alert(data.message || "Gagal menambahkan karyawan.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem saat menyimpan data.");
    }
  }

  function handleEditEmployee(employee: any) {
    setEditingId(employee.id);
    setEmployeeNumber(employee.employee_number || "");
    setName(employee.name || "");
    setDepartment(employee.department || "");
    setPosition(employee.position || "");
    setPhone(employee.phone || "");
    setPhoto(null);

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteEmployee(employee: any) {
    const confirmed = confirm(
      `Yakin ingin menghapus data karyawan: "${employee.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Karyawan berhasil dihapus!");
        loadEmployees();
      } else {
        alert(data.message || "Gagal menghapus karyawan.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghapus data.");
    }
  }

  // Filter Data
  const uniqueDepartments = useMemo(() => {
    const depts = employees
      .map((e) => e.department)
      .filter((d) => Boolean(d));
    return Array.from(new Set(depts));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.username?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept =
        selectedDeptFilter === "ALL" || emp.department === selectedDeptFilter;

      return matchSearch && matchDept;
    });
  }, [employees, searchTerm, selectedDeptFilter]);

  return (
    <main className="min-vh-100 bg-light pb-5">
      {/* ================= HEADER HERO WITH GRADIENT ================= */}
      <div
        className="text-white mb-4 shadow-sm"
        style={{
          background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 50%, #032830 100%)",
        }}
      >
        <div className="container px-4 py-5">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
            <div>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-2 fs-7">
                  <li className="breadcrumb-item">
                    <Link href="/admin" className="text-white-50 text-decoration-none">
                      <i className="bi bi-house-door me-1"></i> Admin
                    </Link>
                  </li>
                  <li className="breadcrumb-item active text-white" aria-current="page">
                    Employees
                  </li>
                </ol>
              </nav>
              <h2 className="fw-extrabold mb-1 d-flex align-items-center gap-3">
                <i className="bi bi-people-fill fs-2"></i> Manajemen Karyawan
              </h2>
              <p className="text-white-50 mb-0 fs-7">
                Kelola akun, informasi personal, status divisi, dan hak akses staf AttendGuard.
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                className={`btn ${
                  showForm ? "btn-danger" : "btn-warning"
                } rounded-3 px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 shadow-lg`}
                onClick={handleToggleForm}
              >
                <i className={`bi ${showForm ? "bi-x-circle-fill" : "bi-plus-circle-fill"} fs-6`}></i>
                {showForm ? "Tutup Form" : "Tambah Karyawan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= STATS WIDGETS SECTION ================= */}
      <div className="container px-4 mb-4">
        <div className="row g-3">
          {/* Card 1 */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-8 fw-semibold text-uppercase">Total Karyawan</span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">{employees.length}</h3>
                  <span className="badge bg-success-subtle text-success fs-9 mt-2 rounded-pill">
                    <i className="bi bi-graph-up me-1"></i> Terdaftar
                  </span>
                </div>
                <div
                  className="rounded-4 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                  style={{ width: "54px", height: "54px" }}
                >
                  <i className="bi bi-person-badge fs-3"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-8 fw-semibold text-uppercase">Total Departemen</span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">{uniqueDepartments.length}</h3>
                  <span className="badge bg-info-subtle text-info fs-9 mt-2 rounded-pill">
                    <i className="bi bi-building me-1"></i> Divisi Kerja
                  </span>
                </div>
                <div
                  className="rounded-4 bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center"
                  style={{ width: "54px", height: "54px" }}
                >
                  <i className="bi bi-diagram-3 fs-3"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-8 fw-semibold text-uppercase">Status Akun</span>
                  <h3 className="fw-bold text-dark mb-0 mt-1">{employees.length}</h3>
                  <span className="badge bg-success-subtle text-success fs-9 mt-2 rounded-pill">
                    <i className="bi bi-check-circle me-1"></i> 100% Aktif
                  </span>
                </div>
                <div
                  className="rounded-4 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center"
                  style={{ width: "54px", height: "54px" }}
                >
                  <i className="bi bi-shield-check fs-3"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-8 fw-semibold text-uppercase">Aksi Cepat</span>
                  <div className="mt-2">
                    <button
                      onClick={loadEmployees}
                      className="btn btn-sm btn-outline-primary rounded-3 me-2 fs-8 fw-semibold"
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i> Sync
                    </button>
                    <button
                      onClick={() => alert("Fitur Export Excel akan segera dirilis!")}
                      className="btn btn-sm btn-outline-success rounded-3 fs-8 fw-semibold"
                    >
                      <i className="bi bi-file-earmark-excel me-1"></i> Export
                    </button>
                  </div>
                </div>
                <div
                  className="rounded-4 bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center"
                  style={{ width: "54px", height: "54px" }}
                >
                  <i className="bi bi-lightning-charge fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="container px-4">
        {/* ================= FORM CARD ================= */}
        {showForm && (
          <div className="card border-0 shadow-lg rounded-4 mb-5 overflow-hidden animate__animated animate__fadeIn">
            <div className="card-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i
                  className={`bi ${
                    editingId !== null ? "bi-pencil-square text-warning" : "bi-person-plus-fill text-primary"
                  } fs-5`}
                ></i>
                {editingId !== null ? "Edit Data Profil Karyawan" : "Registrasi Karyawan Baru"}
              </h6>
              <span className="badge bg-secondary font-monospace">
                {editingId !== null ? `ID: #${editingId}` : "New Entry"}
              </span>
            </div>

            <div className="card-body p-4 p-md-5">
              <div className="row g-4">
                {/* AKUN / LOGIN (HANYA MUNCUL SAAT TAMBAH BARU) */}
                {editingId === null && (
                  <>
                    <div className="col-12">
                      <div className="alert alert-primary border-0 rounded-3 d-flex align-items-center gap-3 mb-0">
                        <i className="bi bi-info-circle-fill fs-4 flex-shrink-0"></i>
                        <div className="fs-8">
                          <strong>Kredensial Login:</strong> Username & Password ini digunakan karyawan untuk masuk ke portal absensi AttendGuard.
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold fs-7 text-dark">
                        Username System <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <i className="bi bi-at text-primary"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 py-2.5 fs-7"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="misal: john.doe"
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold fs-7 text-dark">
                        Password Default <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <i className="bi bi-key-fill text-primary"></i>
                        </span>
                        <input
                          type="password"
                          className="form-control border-start-0 py-2.5 fs-7"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Ketik password awal"
                        />
                      </div>
                    </div>

                    <div className="col-12"><hr className="my-1 opacity-10" /></div>
                  </>
                )}

                {/* DETAIL PROFIL KARYAWAN */}
                <div className="col-md-6">
                  <label className="form-label fw-bold fs-7 text-dark">
                    Nomor Induk Karyawan (NIK) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-card-heading text-secondary"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 py-2.5 fs-7 font-monospace"
                      value={employeeNumber}
                      onChange={(e) => setEmployeeNumber(e.target.value)}
                      placeholder="Contoh: EMP-2026-001"
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold fs-7 text-dark">
                    Nama Lengkap <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-person-vcard text-secondary"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 py-2.5 fs-7"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold fs-7 text-dark">Departemen / Divisi</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-building text-secondary"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 py-2.5 fs-7"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Contoh: IT / Finance"
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold fs-7 text-dark">Jabatan / Position</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-briefcase text-secondary"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 py-2.5 fs-7"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Contoh: Software Engineer"
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold fs-7 text-dark">Nomor Telepon / WhatsApp</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-whatsapp text-success"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 py-2.5 fs-7"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                    />
                  </div>
                </div>

                {/* UPLOAD FOTO (HANYA SAAT TAMBAH BARU) */}
                {editingId === null && (
                  <div className="col-12">
                    <label className="form-label fw-bold fs-7 text-dark">Upload Foto Profil</label>
                    <div className="p-3 border border-2 border-dashed rounded-4 text-center bg-light">
                      <i className="bi bi-cloud-arrow-up fs-2 text-primary"></i>
                      <p className="fs-8 text-muted mb-2">Drag & drop foto atau klik untuk memilih file</p>
                      <input
                        type="file"
                        className="form-control form-control-sm mx-auto"
                        style={{ maxWidth: "350px" }}
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setPhoto(file);
                        }}
                      />
                    </div>

                    {photo && (
                      <div className="mt-3 p-3 bg-white border rounded-4 d-inline-flex align-items-center gap-3 shadow-sm">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt="Preview foto karyawan"
                          className="rounded-circle border object-fit-cover"
                          style={{ width: "60px", height: "60px" }}
                        />
                        <div>
                          <div className="fw-semibold fs-8 text-dark">{photo.name}</div>
                          <div className="text-muted fs-9">{(photo.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="d-flex align-items-center justify-content-end gap-3 mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-light px-4 py-2 fs-7 rounded-3 fw-semibold"
                  onClick={handleToggleForm}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className={`btn ${
                    editingId !== null ? "btn-warning" : "btn-primary"
                  } px-4 py-2.5 fs-7 fw-bold rounded-3 d-inline-flex align-items-center gap-2 shadow-sm`}
                  onClick={handleAddEmployee}
                >
                  <i className={`bi ${editingId !== null ? "bi-check-lg" : "bi-save-fill"} fs-6`}></i>
                  {editingId !== null ? "Update Data Karyawan" : "Simpan Data Karyawan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TABLE TOOLBAR & CARDS ================= */}
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-5">
          {/* TOOLBAR SEARCH & FILTER */}
          <div className="p-4 border-bottom bg-light bg-opacity-50">
            <div className="row g-3 align-items-center justify-content-between">
              <div className="col-12 col-md-5">
                <div className="input-group shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 py-2 fs-7"
                    placeholder="Cari berdasarkan nama, NIK, atau username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-white border-start-0 text-muted"
                      onClick={() => setSearchTerm("")}
                    >
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-7 d-flex flex-wrap align-items-center justify-content-md-end gap-2">
                <span className="fs-8 fw-semibold text-muted d-none d-sm-inline">Filter Divisi:</span>
                <button
                  className={`btn btn-sm ${
                    selectedDeptFilter === "ALL" ? "btn-dark" : "btn-outline-secondary"
                  } rounded-pill px-3 py-1.5 fs-8`}
                  onClick={() => setSelectedDeptFilter("ALL")}
                >
                  Semua ({employees.length})
                </button>
                {uniqueDepartments.map((dept) => (
                  <button
                    key={dept}
                    className={`btn btn-sm ${
                      selectedDeptFilter === dept ? "btn-primary" : "btn-outline-secondary"
                    } rounded-pill px-3 py-1.5 fs-8`}
                    onClick={() => setSelectedDeptFilter(dept)}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE CONTENT */}
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted fs-7 mt-3 mb-0">Memuat database karyawan...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-5 px-4 my-3">
                <div
                  className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="bi bi-search fs-1 text-muted"></i>
                </div>
                <h6 className="fw-bold text-dark mb-1">Data Tidak Ditemukan</h6>
                <p className="text-muted fs-7 mb-3">
                  Tidak ada karyawan yang cocok dengan pencarian &quot;{searchTerm}&quot;.
                </p>
                <button
                  className="btn btn-outline-secondary rounded-3 px-3 py-1.5 fs-8"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDeptFilter("ALL");
                  }}
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light fs-8 text-uppercase text-muted border-bottom">
                    <tr>
                      <th className="ps-4 py-3">No</th>
                      <th className="py-3">Profil Karyawan</th>
                      <th className="py-3">Username</th>
                      <th className="py-3">Departemen</th>
                      <th className="py-3">Jabatan</th>
                      <th className="py-3">Kontak</th>
                      <th className="py-3 text-center">Status</th>
                      <th className="text-end pe-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="fs-7">
                    {filteredEmployees.map((employee, index) => (
                      <tr key={employee.id}>
                        <td className="ps-4 py-3 text-muted fw-bold">{index + 1}</td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className="position-relative">
                              {employee.photo_path ? (
                                <img
                                  src={employee.photo_path}
                                  alt={employee.name}
                                  className="rounded-circle border object-fit-cover shadow-sm"
                                  style={{ width: "45px", height: "45px" }}
                                />
                              ) : (
                                <div
                                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                  style={{ width: "45px", height: "45px", fontSize: "16px" }}
                                >
                                  {employee.name ? employee.name.charAt(0).toUpperCase() : "E"}
                                </div>
                              )}
                              <span
                                className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"
                                title="Akun Aktif"
                              ></span>
                            </div>

                            <div>
                              <div className="fw-bold text-dark">{employee.name}</div>
                              <div className="text-muted fs-8 font-monospace d-flex align-items-center gap-1">
                                <i className="bi bi-hash"></i>
                                {employee.employee_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="badge bg-light text-dark border font-monospace px-2.5 py-1.5 fs-8">
                            <i className="bi bi-at text-muted me-1"></i>
                            {employee.username || "-"}
                          </span>
                        </td>
                        <td className="py-3">
                          {employee.department ? (
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1.5 fs-8 fw-semibold">
                              <i className="bi bi-building me-1"></i>
                              {employee.department}
                            </span>
                          ) : (
                            <span className="text-muted fs-8">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="fw-semibold text-dark">
                            {employee.position || "-"}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-muted fs-8 d-inline-flex align-items-center gap-1">
                            <i className="bi bi-telephone text-success"></i>
                            {employee.phone || "-"}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fs-9">
                            ● Active
                          </span>
                        </td>
                        <td className="text-end pe-4 py-3">
                          <div className="d-inline-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-warning rounded-3 px-2.5 py-1 fs-8 fw-semibold d-inline-flex align-items-center gap-1"
                              onClick={() => handleEditEmployee(employee)}
                              title="Edit Karyawan"
                            >
                              <i className="bi bi-pencil-square"></i> Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-3 px-2.5 py-1 fs-8 fw-semibold d-inline-flex align-items-center gap-1"
                              onClick={() => handleDeleteEmployee(employee)}
                              title="Hapus Karyawan"
                            >
                              <i className="bi bi-trash"></i> Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card-footer bg-light border-top py-3 px-4">
            <div className="d-flex justify-content-between align-items-center fs-8 text-muted">
              <span>
                Menampilkan <strong>{filteredEmployees.length}</strong> dari total <strong>{employees.length}</strong> karyawan
              </span>
              <span className="d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock-fill text-success"></i> Synchronized with Database
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}