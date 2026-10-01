import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Belum login",
        },
        { status: 401 }
      );
    }

    if (user.role !== "EMPLOYEE") {
  return NextResponse.json(
    {
      success: false,
      message: "Hanya employee yang dapat menggunakan fitur ini",
    },
    { status: 403 }
  );
}

    const body = await request.json();

    const { password } = body;

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password wajib diisi",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password minimal 6 karakter",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

   await db.execute(
  `UPDATE users
   SET password = ?, first_login = false
   WHERE id = ?`,
  [hashedPassword, Number(user.userId)]
);
    return NextResponse.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengubah password",
      },
      { status: 500 }
    );
  }
}