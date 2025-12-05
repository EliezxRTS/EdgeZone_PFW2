const express = require('express');
const router = express.Router();
const pool = require('../db'); // tu pool de MySQL
const bcrypt = require('bcryptjs');

// GET registro
router.get('/register', (req, res) => {
    res.render('auth/register', {title:"Registro - EdgeZone"});
});

// POST registro
router.post('/register', async (req, res) => {
    const { username, email, password, password2 } = req.body;
    let errors = [];

    if (!username || !email || !password || !password2) {
        errors.push({ msg: 'Completa todos los campos' });
    }

    if (password !== password2) {
        errors.push({ msg: 'Las contraseñas no coinciden' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (errors.length > 0) {
        return res.render('auth/register', {title:"Registro - EdgeZone"}, { errors, username, email });
    }

    try {
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            errors.push({ msg: 'El correo ya está registrado' });
            return res.render('auth/register', {title:"Registro - EdgeZone"}, { errors, username, email });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        req.flash('success_msg', 'Registro exitoso, ya puedes iniciar sesión');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.render('auth/register', {title:"Registro - EdgeZone"}, { errors: [{ msg: 'Error al registrar usuario' }], username, email });
    }
});

// GET login
router.get('/login', (req, res) => {
    res.render('auth/login', { title:"Login - EdgeZone" });
});

// POST login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            req.flash('error_msg', 'Correo no registrado');
            return res.redirect('/auth/login');
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Contraseña incorrecta');
            return res.redirect('/auth/login');
        }

        req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error al iniciar sesión');
        res.redirect('/auth/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        res.redirect('/auth/login');
    });
});

module.exports = router;
