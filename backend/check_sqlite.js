const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pokemon.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Tables:', rows);
    if (rows.length > 0) {
        db.all("SELECT COUNT(*) as count FROM pokemon", (err, rows) => {
           if (err) console.error(err);
           else console.log('Count:', rows[0].count);
        });
    }
  }
  db.close();
});
