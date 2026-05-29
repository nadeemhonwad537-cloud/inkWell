// scripts/createAdmin.js
// Run this to create YOUR admin account:
//   node scripts/createAdmin.js
//
// You will be asked for name, email, password interactively.
// Nobody can sign up as admin through the website — ONLY this script creates admins.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('\n🖊  Inkwell — Create Admin Account');
  console.log('════════════════════════════════════\n');

  const name     = await ask('Admin name     : ');
  const email    = await ask('Admin email    : ');
  const password = await ask('Admin password : ');

  if (!name || !email || !password) {
    console.error('❌  All fields are required.');
    rl.close(); process.exit(1);
  }

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'inkwell_db',
  });

  // Check if email already exists
  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    console.error(`\n❌  Email "${email}" is already registered.`);
    await conn.end(); rl.close(); process.exit(1);
  }

  const hashed = bcrypt.hashSync(password, 12);
  const [result] = await conn.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hashed, 'admin']
  );

  console.log(`\n✅  Admin created!`);
  console.log(`    ID    : ${result.insertId}`);
  console.log(`    Name  : ${name}`);
  console.log(`    Email : ${email}`);
  console.log(`    Role  : admin`);
  console.log(`\n    You can now sign in at http://localhost:3000/signin\n`);

  await conn.end();
  rl.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
