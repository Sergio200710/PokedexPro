const mysql = require('mysql2/promise');

const passwords = ['', 'root', '1234', 'mysql', 'admin', 'password', 'sergio200710', 'Sergio200710', '200710', 'sergio2007', 'Sergio2007', 'pokedex', 'pokedex2026', 'sergio2026', 'Admin123', 'admin123', '123456', '12345678', 'mariadb'];
const users = ['root', 'sergio'];

async function test(user, password) {
  try {
    const db = await mysql.createConnection({
      host: '127.0.0.1',
      user: user,
      password: password,
    });
    console.log(`FOUND_CREDENTIALS: ${user}:${password}`);
    await db.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function run() {
  for (const user of users) {
    for (const pwd of passwords) {
      if (await test(user, pwd)) process.exit(0);
    }
  }
  console.log('No working credentials found.');
}

run();
