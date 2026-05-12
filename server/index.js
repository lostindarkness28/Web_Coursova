const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const path = require('path');
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../login.html'));
});
app.use(express.static(path.join(__dirname, '../')));


app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

db.getConnection((err, conn) => {
    if (err) console.log("Помилка БД:", err.message);
    else {
        console.log("MySQL підключено успішно!");
        conn.release();
    }
});

app.post('/api/register', async (req, res) => {
    const { full_name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
        db.query(sql, [full_name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Такий email вже зайнятий!" });
                return res.status(500).json(err);
            }
            res.status(201).json({ message: "Користувач зареєстрований!" });
        });
    } catch (e) {
        res.status(500).send("Помилка на сервері");
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT id, full_name, email, password FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Користувача не знайдено!" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ message: "Невірний пароль!" });

        res.json({
            message: "Вхід успішний!",
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email
            }
        });
    });
});
app.post('/api/events', (req, res) => {
    const { user_id, title, description, event_date, category } = req.body;
    const sql = "INSERT INTO events (user_id, title, description, event_date, category) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [user_id, title, description, event_date, category], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ id: result.insertId });
    });
});

app.get('/api/events/:userId', (req, res) => {
    const sql = "SELECT id, title, description, DATE_FORMAT(event_date, '%Y-%m-%d') as event_date, category FROM events WHERE user_id = ?";
    db.query(sql, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        console.log("Отправляем события:", results);
        res.json(results);
    });
});

app.put('/api/events/:id', (req, res) => {
    const { title, event_date, category } = req.body;
    const sql = "UPDATE events SET title = ?, event_date = ?, category = ? WHERE id = ?";
    db.query(sql, [title, event_date, category, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Updated" });
    });
});
app.delete('/api/events/:id', (req, res) => {
    const eventId = req.params.id;
    const sql = "DELETE FROM events WHERE id = ?";
    db.query(sql, [eventId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Success" });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));