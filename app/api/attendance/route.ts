import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";


// ================================
// HITUNG JARAK GPS
// ================================
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


// ================================
// SIMPAN SELFIE
// ================================
async function saveSelfie(
  selfie: string,
  employeeId: number
) {
  // Pastikan format selfie JPEG
  if (
    !selfie ||
    !selfie.startsWith(
      "data:image/jpeg;base64,"
    )
  ) {
    return null;
  }

  // Ambil bagian Base64 saja
  const base64Data = selfie.replace(
    /^data:image\/jpeg;base64,/,
    ""
  );

  // Ubah Base64 menjadi Buffer
  const buffer = Buffer.from(
    base64Data,
    "base64"
  );

  // Maksimal 2 MB
  if (
    buffer.length >
    2 * 1024 * 1024
  ) {
    throw new Error(
      "Ukuran selfie terlalu besar"
    );
  }

  // Nama file
  const fileName =
    `employee-${employeeId}-${Date.now()}.jpg`;

  // Folder penyimpanan
  const uploadDirectory =
    path.join(
      process.cwd(),
      "public",
      "uploads",
      "selfies"
    );

  // Lokasi lengkap file
  const filePath =
    path.join(
      uploadDirectory,
      fileName
    );

  // Pastikan folder tersedia
  await fs.mkdir(
    uploadDirectory,
    {
      recursive: true,
    }
  );

  // Simpan file JPG
  await fs.writeFile(
    filePath,
    buffer
  );

  // Path yang disimpan ke database
  return `/uploads/selfies/${fileName}`;
}


// ================================
// CHECK IN
// ================================
export async function POST(
  request: Request
) {
  try {
    // Cek session
    const user =
      await getCurrentUser();

    if (
      !user ||
      user.role !== "EMPLOYEE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak",
        },
        {
          status: 401,
        }
      );
    }

    // Ambil data dari frontend
    const body =
      await request.json();

    const {
      latitude,
      longitude,
      gps_accuracy,
      address,
      selfie,
    } = body;


    // ================================
    // CEK GPS
    // ================================
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lokasi GPS wajib dikirim",
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // CEK SELFIE
    // ================================
    if (!selfie) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selfie wajib diambil",
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // CARI EMPLOYEE
    // ================================
    const [employees]: any =
      await db.execute(
        `SELECT id
         FROM employees
         WHERE user_id = ?`,
        [
          Number(user.userId),
        ]
      );

    if (
      employees.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data employee tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    const employeeId =
      employees[0].id;


    // ================================
    // AMBIL LOKASI KANTOR
    // ================================
    const [
      officeLocations,
    ]: any =
      await db.execute(
        `SELECT
          latitude,
          longitude,
          radius
         FROM office_locations
         LIMIT 1`
      );

    if (
      officeLocations.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lokasi kantor belum diatur",
        },
        {
          status: 400,
        }
      );
    }

    const office =
      officeLocations[0];


    // ================================
    // HITUNG JARAK
    // ================================
    const distance =
      calculateDistance(
        Number(latitude),
        Number(longitude),
        Number(office.latitude),
        Number(office.longitude)
      );

    console.log(
      "Jarak check-in ke kantor:",
      distance,
      "meter"
    );


    // ================================
    // CEK GEOFENCE
    // ================================
    if (
      distance >
      Number(office.radius)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Anda berada di luar area kantor. ` +
            `Jarak Anda sekitar ${Math.round(
              distance
            )} meter.`,
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // CEK CHECK-IN HARI INI
    // ================================
    const [
      existingAttendance,
    ]: any =
      await db.execute(
        `SELECT id
         FROM attendances
         WHERE employee_id = ?
         AND attendance_date = CURDATE()
         AND type = 'CHECK_IN'`,
        [
          employeeId,
        ]
      );

    if (
      existingAttendance.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda sudah melakukan check-in hari ini",
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // SIMPAN SELFIE
    // ================================
    const selfiePath =
      await saveSelfie(
        selfie,
        employeeId
      );

    if (!selfiePath) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format selfie tidak valid",
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // SIMPAN CHECK-IN
    // ================================
    await db.execute(
      `INSERT INTO attendances
      (
        employee_id,
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
      )
      VALUES
      (
        ?,
        'CHECK_IN',
        CURDATE(),
        CURTIME(),
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        'VALID'
      )`,
      [
        employeeId,
        latitude,
        longitude,
        gps_accuracy || null,
        distance,
        address || null,
        selfiePath,
      ]
    );


    return NextResponse.json({
      success: true,
      message:
        "Check-in berhasil",
    });

  } catch (error) {
    console.error(
      "Check-in error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal melakukan check-in",
      },
      {
        status: 500,
      }
    );
  }
}


// ================================
// CHECK OUT
// ================================
export async function PUT(
  request: Request
) {
  try {
    // Cek session
    const user =
      await getCurrentUser();

    if (
      !user ||
      user.role !== "EMPLOYEE"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak",
        },
        {
          status: 401,
        }
      );
    }

    // Ambil data
    const body =
      await request.json();

    const {
      latitude,
      longitude,
      gps_accuracy,
      address,
      selfie,
    } = body;


    // ================================
    // CEK GPS
    // ================================
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lokasi GPS wajib dikirim",
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // CEK SELFIE
    // ================================
    if (!selfie) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selfie wajib diambil",
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // CARI EMPLOYEE
    // ================================
    const [employees]: any =
      await db.execute(
        `SELECT id
         FROM employees
         WHERE user_id = ?`,
        [
          Number(user.userId),
        ]
      );

    if (
      employees.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data employee tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    const employeeId =
      employees[0].id;


    // ================================
    // AMBIL LOKASI KANTOR
    // ================================
    const [
      officeLocations,
    ]: any =
      await db.execute(
        `SELECT
          latitude,
          longitude,
          radius
        FROM office_locations
        ORDER BY id ASC
        LIMIT 1`
      );

    if (
      officeLocations.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Lokasi kantor belum diatur",
        },
        {
          status: 400,
        }
      );
    }

    const office =
      officeLocations[0];


    // ================================
    // HITUNG JARAK
    // ================================
    const distance =
      calculateDistance(
        Number(latitude),
        Number(longitude),
        Number(office.latitude),
        Number(office.longitude)
      );

    console.log(
      "Jarak check-out ke kantor:",
      distance,
      "meter"
    );


    // ================================
    // CEK GEOFENCE
    // ================================
    if (
      distance >
      Number(office.radius)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Check-out ditolak. ` +
            `Anda berada sekitar ${Math.round(
              distance
            )} meter dari kantor.`,
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // CEK CHECK-IN
    // ================================
    const [checkIn]: any =
      await db.execute(
        `SELECT id
         FROM attendances
         WHERE employee_id = ?
         AND attendance_date = CURDATE()
         AND type = 'CHECK_IN'`,
        [
          employeeId,
        ]
      );

    if (
      checkIn.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda belum melakukan check-in hari ini",
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // CEK CHECK-OUT
    // ================================
    const [checkOut]: any =
      await db.execute(
        `SELECT id
         FROM attendances
         WHERE employee_id = ?
         AND attendance_date = CURDATE()
         AND type = 'CHECK_OUT'`,
        [
          employeeId,
        ]
      );

    if (
      checkOut.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda sudah melakukan check-out hari ini",
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // SIMPAN SELFIE CHECK-OUT
    // ================================
    const selfiePath =
      await saveSelfie(
        selfie,
        employeeId
      );

    if (!selfiePath) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Format selfie tidak valid",
        },
        {
          status: 400,
        }
      );
    }


    // ================================
    // SIMPAN CHECK-OUT
    // ================================
    await db.execute(
      `INSERT INTO attendances
      (
        employee_id,
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
      )
      VALUES
      (
        ?,
        'CHECK_OUT',
        CURDATE(),
        CURTIME(),
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        'VALID'
      )`,
      [
        employeeId,
        latitude,
        longitude,
        gps_accuracy || null,
        distance,
        address || null,
        selfiePath,
      ]
    );


    return NextResponse.json({
      success: true,
      message:
        "Check-out berhasil",
    });

  } catch (error) {
    console.error(
      "Check-out error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Gagal melakukan check-out",
      },
      {
        status: 500,
      }
    );
  }
}