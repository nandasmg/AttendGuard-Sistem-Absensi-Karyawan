
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// ========================================
// SIMPAN FOTO EMPLOYEE
// ========================================

async function saveEmployeePhoto(
  photo: File
): Promise<string> {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(photo.type)) {
    throw new Error(
      "Format foto harus JPG, PNG, atau WEBP"
    );
  }

  // Maksimal 2 MB
  if (photo.size > 2 * 1024 * 1024) {
    throw new Error(
      "Ukuran foto maksimal 2 MB"
    );
  }

  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extension = extensionMap[photo.type];

  const fileName =
    `employee-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${extension}`;

  const uploadDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "employees"
  );

  const filePath = path.join(
    uploadDirectory,
    fileName
  );

  await fs.mkdir(uploadDirectory, {
    recursive: true,
  });

  const arrayBuffer = await photo.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  await fs.writeFile(filePath, buffer);

  return `/uploads/employees/${fileName}`;
}

// ========================================
// POST — BUAT EMPLOYEE
// Mendukung JSON dan FormData
// ========================================

export async function POST(request: Request) {
  try {
    // Cek session Admin
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak",
        },
        { status: 403 }
      );
    }

    let username = "";
    let password = "";
    let employee_number = "";
    let name = "";
    let department = "";
    let position = "";
    let phone = "";
    let photo: File | null = null;

    const contentType =
      request.headers.get("content-type") || "";

    // ========================================
    // JIKA DATA BERUPA FORMDATA
    // ========================================

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      username = String(
        formData.get("username") || ""
      );

      password = String(
        formData.get("password") || ""
      );

      employee_number = String(
        formData.get("employee_number") || ""
      );

      name = String(
        formData.get("name") || ""
      );

      department = String(
        formData.get("department") || ""
      );

      position = String(
        formData.get("position") || ""
      );

      phone = String(
        formData.get("phone") || ""
      );

      const photoValue = formData.get("photo");

      if (photoValue instanceof File) {
        if (photoValue.size > 0) {
          photo = photoValue;
        }
      }

    } else {

      // ========================================
      // JIKA DATA BERUPA JSON
      // ========================================

      const body = await request.json();

      username = body.username || "";
      password = body.password || "";
      employee_number = body.employee_number || "";
      name = body.name || "";
      department = body.department || "";
      position = body.position || "";
      phone = body.phone || "";

    }

    // ========================================
    // VALIDASI DATA WAJIB
    // ========================================

    if (
      !username ||
      !password ||
      !employee_number ||
      !name
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Username, password, nomor employee, dan nama wajib diisi",
        },
        { status: 400 }
      );
    }

    // ========================================
    // CEK USERNAME
    // ========================================

    const [existingUser]: any = await db.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Username sudah digunakan",
        },
        { status: 400 }
      );
    }

    // ========================================
    // CEK NOMOR EMPLOYEE
    // ========================================

    const [existingEmployee]: any = await db.execute(
      "SELECT id FROM employees WHERE employee_number = ?",
      [employee_number]
    );

    if (existingEmployee.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Nomor employee sudah digunakan",
        },
        { status: 400 }
      );
    }

    // ========================================
    // SIMPAN FOTO JIKA ADA
    // ========================================

    let photoPath: string | null = null;

    if (photo) {
      photoPath = await saveEmployeePhoto(photo);
    }

    // ========================================
    // HASH PASSWORD
    // ========================================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // ========================================
    // SIMPAN USER
    // ========================================

    const [userResult]: any = await db.execute(
      `INSERT INTO users
      (username, password, role, first_login)
      VALUES (?, ?, 'EMPLOYEE', true)`,
      [username, hashedPassword]
    );

    const userId = userResult.insertId;

    // ========================================
    // SIMPAN DATA EMPLOYEE
    // ========================================

    await db.execute(
      `INSERT INTO employees
      (
        user_id,
        employee_number,
        name,
        department,
        position,
        phone,
        photo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        employee_number,
        name,
        department || null,
        position || null,
        phone || null,
        photoPath,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Employee berhasil dibuat",
    });

  } catch (error: any) {
    console.error(
      "Create employee error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error.message ||
          "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}

// ========================================
// GET — AMBIL DATA EMPLOYEE
// ========================================

export async function GET() {
  try {
    // Cek session Admin
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak",
        },
        { status: 403 }
      );
    }

    const [rows] = await db.execute(`
      SELECT
        employees.id,
        employees.employee_number,
        employees.name,
        employees.department,
        employees.position,
        employees.phone,
        employees.photo,
        users.username
      FROM employees
      INNER JOIN users
        ON employees.user_id = users.id
      ORDER BY employees.id DESC
    `);

    return NextResponse.json({
      success: true,
      employees: rows,
    });

  } catch (error) {
    console.error(
      "Get employees error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal mengambil data employee",
      },
      { status: 500 }
    );
  }
}