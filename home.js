// routes/home.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const renderWithMessage = (res, view, message) => {
    res.render(view, { message });
};

module.exports = (pool) => {
    // Home Page
    router.get('/', (req, res) => {
        res.render('index');
    });

    // Sign Up
    router.get('/signup', (req, res) => {
        res.render('signup');
    });

    router.post('/signup', async (req, res) => {
        const { user_id, password, name } = req.body;

        const userCheck = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
        if (userCheck.rowCount > 0) {
            return renderWithMessage(res, 'signup', 'User ID already exists, please choose another.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (password, name) VALUES ($1, $2)', [hashedPassword, name]);
        res.redirect('/login');
    });

    // Sign In
    router.get('/login', (req, res) => {
        res.render('login');
    });

    router.post('/login', async (req, res) => {
        const { user_id, password } = req.body;
        const user = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);

        if (user.rowCount === 0 || !(await bcrypt.compare(password, user.rows[0].password))) {
            return renderWithMessage(res, 'login', 'Invalid credentials, please try again.');
        }

        req.session.user_id = user.rows[0].user_id; // Store user ID in session
        res.redirect('/blogs');
    });

    // Blog Feed
    router.get('/blogs', async (req, res) => {
        if (!req.session.user_id) {
            return res.redirect('/login');
        }
        const blogs = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
        res.render('blog', { blogs: blogs.rows });
    });

    // Create Blog Post
    router.post('/blogs', async (req, res) => {
        const { title, body } = req.body;
        await pool.query('INSERT INTO blogs (creator_name, creator_user_id, title, body) VALUES ($1, $2, $3, $4)',
            [req.session.user_id, req.session.user_id, title, body]);
        res.redirect('/blogs');
    });

    // Edit Blog Post
    router.get('/edit/:id', async (req, res) => {
        const { id } = req.params;
        const blog = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [id]);

        // Check if blog exists
        if (blog.rowCount === 0) {
            return res.redirect('/blogs');
        }
        
        res.render('edit', { blog: blog.rows[0] });
    });

    router.post('/edit/:id', async (req, res) => {
        const { id } = req.params;
        const { title, body } = req.body;
        await pool.query('UPDATE blogs SET title = $1, body = $2 WHERE blog_id = $3', [title, body, id]);
        res.redirect('/blogs');
    });

    // Delete Blog Post
    router.post('/delete/:id', async (req, res) => {
        const { id } = req.params;
        await pool.query('DELETE FROM blogs WHERE blog_id = $1', [id]);
        res.redirect('/blogs');
    });

    return router;
};
