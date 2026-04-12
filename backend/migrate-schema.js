require("dotenv").config();
const db = require("./config/db");

const migrations = [
  {
    name: "Add department column",
    sql: "ALTER TABLE users ADD COLUMN department VARCHAR(100)",
  },
  {
    name: "Add bio column",
    sql: "ALTER TABLE users ADD COLUMN bio TEXT",
  },
  {
    name: "Add specialty column",
    sql: "ALTER TABLE users ADD COLUMN specialty VARCHAR(100)",
  },
  {
    name: "Add experience column",
    sql: "ALTER TABLE users ADD COLUMN experience INT DEFAULT 0",
  },
  {
    name: "Add rating column",
    sql: "ALTER TABLE users ADD COLUMN rating DECIMAL(2,1) DEFAULT 4.5",
  },
];

let completed = 0;

console.log("🔄 Running database migrations...\n");

const runMigrations = async () => {
  for (const migration of migrations) {
    await new Promise((resolve) => {
      db.query(migration.sql, (err) => {
        if (err) {
          // Ignore "duplicate column" errors, but show other errors
          if (err.message.includes("Duplicate column")) {
            console.log(`⏭️  ${migration.name} (already exists)`);
          } else {
            console.error(`❌ ${migration.name}: ${err.message}`);
          }
        } else {
          console.log(`✅ ${migration.name}`);
        }
        resolve();
      });
    });
  }

  console.log("\n✅ All migrations completed!");
  console.log("\nDatabase schema is now ready.");
  console.log("You can stop this and run: npm run dev");
  process.exit(0);
};

runMigrations();
