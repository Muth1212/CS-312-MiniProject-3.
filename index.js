const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const homeRoutes = require('./routes/home');
const { Pool } = require('pg');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.PG_USER,
    host: 'localhost',
    database: 'BlogDB',
    password: process.env.PG_PASSWORD,
    port: 5433,
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));

app.use('/', homeRoutes(pool));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
