const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());

const db = new sqlite3.Database(':memory:'); // Using in-memory DB for simplicity, or we can use a file. Let's use a file: './pokemon.db'

// Let's change into a file database to comply strictly ("Disponer de una base de datos")
const fileDb = new sqlite3.Database('./pokemon.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the pokemon database.');
});

fileDb.serialize(() => {
    // Create Table
    fileDb.run(`CREATE TABLE IF NOT EXISTS pokemon (
        id INTEGER PRIMARY KEY,
        name TEXT,
        url TEXT
    )`);

    // Check if empty, then populate
    fileDb.get("SELECT COUNT(*) as count FROM pokemon", async (err, row) => {
        if (err) return console.error(err.message);
        if (row.count === 0) {
            console.log("Database is empty, fetching from external API...");
            try {
                // Fetch first 151 pokemons (Generation 1 for the demo, or maybe more)
                const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
                const data = await res.json();
                
                const stmt = fileDb.prepare("INSERT INTO pokemon (id, name, url) VALUES (?, ?, ?)");
                data.results.forEach((p, index) => {
                    stmt.run(index + 1, p.name, p.url);
                });
                stmt.finalize();
                console.log("Database populated successfully!");
            } catch (e) {
                console.error("Error fetching data:", e);
            }
        } else {
            console.log("Database already populated. Count:", row.count);
        }
    });
});

app.get('/api/pokemon', (req, res) => {
    const search = req.query.search ? req.query.search.toLowerCase() : '';
    let query = "SELECT * FROM pokemon";
    let params = [];
    
    if (search) {
        query += " WHERE name LIKE ?";
        params.push(`%${search}%`);
    }

    fileDb.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
