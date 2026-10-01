import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Cek login
    const user = await getCurrentUser();

    // Hanya ADMIN yang boleh mengakses
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak",
        },
        {
          status: 403,
        }
      );
    }

    // Ambil semua data attendance
    const [attendanceRows]: any = await db.execute(
      `SELECT
        attendances.id,
        employees.employee_number,
        employees.name,
        employees.department,
        attendances.type,
        attendances.attendance_date,
        attendances.attendance_time,
        attendances.latitude,
        attendances.longitude,
        attendances.gps_accuracy,
        attendances.distance_from_office,
        attendances.address,
        attendances.selfie,
        attendances.status
      FROM attendances
      INNER JOIN employees
        ON attendances.employee_id = employees.id
      ORDER BY
        attendances.attendance_date DESC,
        attendances.attendance_time DESC`
    );

    return NextResponse.json({
      success: true,
      attendances: attendanceRows,
    });

  } catch (error) {
    console.error(
      "GET admin attendance error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data attendance",
      },
      {
        status: 500,
      }
    );
  }
}