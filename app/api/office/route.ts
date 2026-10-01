import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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

    const [rows]: any = await db.execute(
      `SELECT
        id,
        name,
        latitude,
        longitude,
        radius,
        created_at
      FROM office_locations
      ORDER BY id DESC
      LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        office: null,
      });
    }

    return NextResponse.json({
      success: true,
      office: rows[0],
    });

  } catch (error) {
    console.error("GET office error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil lokasi kantor",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json();

    const {
      name,
      latitude,
      longitude,
      radius,
    } = body;

    if (
      !name ||
      latitude === undefined ||
      longitude === undefined ||
      radius === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Semua data lokasi wajib diisi",
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(Number(latitude))) {
      return NextResponse.json(
        {
          success: false,
          message: "Latitude tidak valid",
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(Number(longitude))) {
      return NextResponse.json(
        {
          success: false,
          message: "Longitude tidak valid",
        },
        { status: 400 }
      );
    }

    if (Number(radius) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Radius harus lebih dari 0 meter",
        },
        { status: 400 }
      );
    }

    // Cek apakah lokasi kantor sudah ada
    const [rows]: any = await db.execute(
      `SELECT id
       FROM office_locations
       ORDER BY id ASC
       LIMIT 1`
    );

    if (rows.length > 0) {

      // Kalau sudah ada → UPDATE
      await db.execute(
        `UPDATE office_locations
         SET
           name = ?,
           latitude = ?,
           longitude = ?,
           radius = ?
         WHERE id = ?`,
        [
          name,
          Number(latitude),
          Number(longitude),
          Number(radius),
          rows[0].id,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Lokasi kantor berhasil diperbarui",
      });
    }

    // Kalau belum ada → INSERT
    await db.execute(
      `INSERT INTO office_locations
        (name, latitude, longitude, radius)
       VALUES (?, ?, ?, ?)`,
      [
        name,
        Number(latitude),
        Number(longitude),
        Number(radius),
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Lokasi kantor berhasil disimpan",
    });

  } catch (error) {
    console.error("POST office error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyimpan lokasi kantor",
      },
      { status: 500 }
    );
  }
}