const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  const username = "admin";
  const password = "admin123";

  const hashedPassword = await bcrypt.hash(password, 10);

  const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "attendguard",
  });

  await db.execute(
    "INSERT INTO users (username, password, role, first_login) VALUES (?, ?, ?, ?)",
    [username, hashedPassword, "ADMIN", false]
  );

  console.log("Admin berhasil dibuat!");
  console.log("Username:", username);
  console.log("Password:", password);

  await db.end();
}

createAdmin().catch((error) => {
  console.error("Gagal membuat admin:", error.message);
});