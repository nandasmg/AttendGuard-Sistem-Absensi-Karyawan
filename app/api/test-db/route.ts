import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = body.username;
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username dan password wajib diisi",
        },
        { status: 400 }
      );
    }

    const [rows]: any = await db.execute(
  "SELECT * FROM users WHERE username = ?",
  [username]
);

console.log("DATABASE TEST - rows:", rows);

console.log("DATABASE TEST - rows:", rows);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Username atau password salah",
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Username atau password salah",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}