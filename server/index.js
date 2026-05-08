const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Щоб розуміти JSON від фронтенда

// 1. Налаштування підключення до БД (дані беруться з .env)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'vnik34rvdkgbd', // <--- Впиши свій пароль від MySQL!
    database: 'smart_calendar'
});

// Перевірка коннекту
db.getConnection((err, conn) => {
    if (err) console.log("Помилка БД:", err.message);
    else {
        console.log("MySQL підключено успішно!");
        conn.release();
    }
});

// 2. МАРШРУТ РЕЄСТРАЦІЇ
app.post('/api/register', async (req, res) => {
    const { full_name, email, password } = req.body;

    try {
        // Хешуємо пароль (робимо "кашу")
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

// 3. МАРШРУТ ВХОДУ (LOGIN)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT id, full_name, email, password FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Користувача не знайдено!" });

        const user = results[0];
        // Порівнюємо введений пароль з хешем у базі
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

const PORT = 5000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));