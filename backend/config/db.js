require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mysql = require("mysql2");

const isVercel = process.env.VERCEL === "1";
const env = (key, fallback = "") => (process.env[key] || fallback).toString().trim();
const dbHost = env("DB_HOST", "localhost");
const useTls = env("DB_SSL", dbHost === "localhost" ? "false" : "true").toLowerCase() !== "false";

if (isVercel && !env("DB_HOST")) {
  console.error("DB_HOST is not set in Vercel environment variables.");
}

const pool = mysql.createPool({
  host: dbHost,
  port: parseInt(env("DB_PORT", "3306"), 10),
  user: env("DB_USER", "root"),
  password: env("DB_PASSWORD", ""),
  database: env("DB_NAME", "medicare"),
  connectTimeout: parseInt(env("DB_CONNECT_TIMEOUT", "20000"), 10),
  ssl: useTls ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("DB connection failed:", err.message);
    return;
  }
  console.log("MySQL pool connected");
  connection.release();
});

module.exports = pool;
