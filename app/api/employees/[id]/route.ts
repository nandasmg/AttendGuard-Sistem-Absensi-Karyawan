import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      employee_number,
      name,
      department,
      position,
      phone,
    } = body;

    if (!employee_number || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee number dan nama wajib diisi",
        },
        { status: 400 }
      );
    }

    const [result]: any = await db.execute(
      `UPDATE employees
       SET employee_number = ?,
           name = ?,
           department = ?,
           position = ?,
           phone = ?
       WHERE id = ?`,
      [
        employee_number,
        name,
        department || null,
        position || null,
        phone || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Employee berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update employee error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui employee",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Ambil user_id dari employee
    const [employees]: any = await db.execute(
      "SELECT user_id FROM employees WHERE id = ?",
      [id]
    );

    if (employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const userId = employees[0].user_id;

    // Hapus employee
    await db.execute(
      "DELETE FROM employees WHERE id = ?",
      [id]
    );

    // Hapus akun user
    await db.execute(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    return NextResponse.json({
      success: true,
      message: "Employee berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete employee error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghapus employee",
      },
      { status: 500 }
    );
  }
}