import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

type AttendanceRow = {
  id: number;
  type: "CHECK_IN" | "CHECK_OUT";
  attendance_date: string | Date;
  attendance_time: string;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  distance_from_office: number | null;
  address: string | null;
  selfie: string | null;
  status: "VALID" | "REJECTED";
};

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getDateDaysAgo(days: number) {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);

  return date;
}

function isWeekend(date: Date) {
  const day = date.getDay();

  return day === 0 || day === 6;
}

function getDayName(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
  });
}

function getAttendanceTime(time: any) {
  if (!time) {
    return null;
  }

  if (typeof time === "string") {
    return time.substring(0, 8);
  }

  return String(time);
}

function isLate(checkInTime: string | null) {
  if (!checkInTime) {
    return false;
  }

  // Sementara jam masuk kantor = 08:00
  // Nanti kita pindahkan ke pengaturan admin.
  return checkInTime > "08:00:00";
}

export async function GET(request: Request) {
  try {
    // ========================================
    // CEK LOGIN
    // ========================================

    const user = await getCurrentUser();

    if (!user || user.role !== "EMPLOYEE") {
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

    // ========================================
    // AMBIL PARAMETER PERIODE
    // ========================================

    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") || "30";

    let days = 30;

    if (period === "7") {
      days = 7;
    }

    if (period === "30") {
      days = 30;
    }

    if (period === "90") {
      days = 90;
    }

    if (period === "365") {
      days = 365;
    }

    // ========================================
    // AMBIL EMPLOYEE
    // ========================================

    const [employeeRows]: any = await db.execute(
      `
      SELECT
        id,
        employee_number,
        name,
        department,
        position
      FROM employees
      WHERE user_id = ?
      LIMIT 1
      `,
      [Number(user.userId)]
    );

    if (employeeRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Data employee tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    const employee = employeeRows[0];

    // ========================================
    // TENTUKAN TANGGAL
    // ========================================

    const startDate = getDateDaysAgo(days - 1);

    const startDateString = formatDate(startDate);

    // ========================================
    // AMBIL DATA ABSENSI
    // ========================================

    const [attendanceRows]: any = await db.execute(
      `
      SELECT
        id,
        type,
        attendance_date,
        attendance_time,
        latitude,
        longitude,
        gps_accuracy,
        distance_from_office,
        address,
        selfie,
        status
      FROM attendances
      WHERE employee_id = ?
        AND attendance_date >= ?
      ORDER BY
        attendance_date ASC,
        attendance_time ASC
      `,
      [
        employee.id,
        startDateString,
      ]
    );

    const rows: AttendanceRow[] = attendanceRows;

    // ========================================
    // KELOMPOKKAN ABSENSI BERDASARKAN TANGGAL
    // ========================================

    const attendanceByDate: Record<
      string,
      {
        checkIn: AttendanceRow | null;
        checkOut: AttendanceRow | null;
      }
    > = {};

    for (const attendance of rows) {
      const dateKey = formatDate(
        new Date(attendance.attendance_date)
      );

      if (!attendanceByDate[dateKey]) {
        attendanceByDate[dateKey] = {
          checkIn: null,
          checkOut: null,
        };
      }

      if (attendance.type === "CHECK_IN") {
        attendanceByDate[dateKey].checkIn =
          attendance;
      }

      if (attendance.type === "CHECK_OUT") {
        attendanceByDate[dateKey].checkOut =
          attendance;
      }
    }

    // ========================================
    // BUAT DAFTAR KEHADIRAN PER HARI
    // ========================================

    const history = [];

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    for (
      let i = days - 1;
      i >= 0;
      i--
    ) {
      const date = new Date(today);

      date.setDate(
        today.getDate() - i
      );

      const dateKey = formatDate(date);

      const dayName = getDayName(date);

      // ========================================
      // LIBUR SABTU / MINGGU
      // ========================================

      if (isWeekend(date)) {
        history.push({
          date: dateKey,
          day: dayName,

          status: "LIBUR",

          checkIn: null,
          checkOut: null,

          checkInTime: null,
          checkOutTime: null,

          latitude: null,
          longitude: null,

          distanceFromOffice: null,

          address: null,

          selfie: null,
        });

        continue;
      }

      // ========================================
      // CARI ABSENSI
      // ========================================

      const attendance =
        attendanceByDate[dateKey];

      const checkIn =
        attendance?.checkIn || null;

      const checkOut =
        attendance?.checkOut || null;

      const checkInTime =
        checkIn
          ? getAttendanceTime(
              checkIn.attendance_time
            )
          : null;

      const checkOutTime =
        checkOut
          ? getAttendanceTime(
              checkOut.attendance_time
            )
          : null;

      // ========================================
      // TENTUKAN STATUS
      // ========================================

      let status =
        "TIDAK_HADIR";

      if (checkIn && !checkOut) {
        status = "BELUM_CHECK_OUT";
      }

      if (checkIn && checkOut) {
        if (isLate(checkInTime)) {
          status = "TERLAMBAT";
        } else {
          status = "HADIR";
        }
      }

      history.push({
        date: dateKey,
        day: dayName,

        status,

        checkIn: checkIn
          ? {
              id: checkIn.id,
              time: checkInTime,
              latitude: checkIn.latitude,
              longitude: checkIn.longitude,
              gpsAccuracy: checkIn.gps_accuracy,
              distanceFromOffice:
                checkIn.distance_from_office,
              address: checkIn.address,
              selfie: checkIn.selfie,
              attendanceStatus:
                checkIn.status,
            }
          : null,

        checkOut: checkOut
          ? {
              id: checkOut.id,
              time: checkOutTime,
              latitude: checkOut.latitude,
              longitude: checkOut.longitude,
              gpsAccuracy: checkOut.gps_accuracy,
              distanceFromOffice:
                checkOut.distance_from_office,
              address: checkOut.address,
              selfie: checkOut.selfie,
              attendanceStatus:
                checkOut.status,
            }
          : null,

        checkInTime,
        checkOutTime,

        latitude:
          checkIn?.latitude ?? null,

        longitude:
          checkIn?.longitude ?? null,

        distanceFromOffice:
          checkIn?.distance_from_office ?? null,

        address:
          checkIn?.address ?? null,

        selfie:
          checkIn?.selfie ?? null,
      });
    }

    // ========================================
    // HITUNG RINGKASAN
    // ========================================

    const summary = {
      totalDays: history.length,

      hadir: history.filter(
        (item) =>
          item.status === "HADIR"
      ).length,

      terlambat: history.filter(
        (item) =>
          item.status === "TERLAMBAT"
      ).length,

      tidakHadir: history.filter(
        (item) =>
          item.status === "TIDAK_HADIR"
      ).length,

      belumCheckOut: history.filter(
        (item) =>
          item.status === "BELUM_CHECK_OUT"
      ).length,

      libur: history.filter(
        (item) =>
          item.status === "LIBUR"
      ).length,
    };

    // ========================================
    // RESPONSE
    // ========================================

    return NextResponse.json({
      success: true,

      employee: {
        id: employee.id,
        employeeNumber:
          employee.employee_number,
        name: employee.name,
        department:
          employee.department,
        position:
          employee.position,
      },

      period,

      summary,

      history,
    });

  } catch (error) {
    console.error(
      "Employee attendance history error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal mengambil riwayat kehadiran",
      },
      {
        status: 500,
      }
    );
  }
}