const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireLogin = require('../middlewares/auth');

// Obtener info del usuario (Mi Cuenta)
router.get('/', requireLogin, async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [rows] = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (!rows.length) {
            return res.status(404).send("Usuario no encontrado");
        }

        // Renderiza la vista cuenta.hbs y pasa los datos del usuario
        res.render('auth/cuenta', {
            title: 'Mi Cuenta',
            user: rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error al obtener la información del usuario");
    }
});

// Mostrar la vista de actualizar cuenta
router.get('/actualizar', requireLogin, async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [rows] = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (!rows.length) {
            return res.status(404).send("Usuario no encontrado");
        }

        res.render('auth/actualizar_cuenta', {
            title: 'Actualizar Cuenta',
            user: rows[0],
            mensaje: null
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar información del usuario");
    }
});

// Procesar actualización de usuario
router.post('/actualizar', requireLogin, async (req, res) => {
    const userId = req.session.user.id;
    const cambios = {};

    // Solo agregamos los campos que no estén vacíos
    if (req.body.username && req.body.username.trim() !== '') cambios.username = req.body.username.trim();
    if (req.body.email && req.body.email.trim() !== '') cambios.email = req.body.email.trim();
    if (req.body.password && req.body.password.trim() !== '') cambios.password = req.body.password.trim(); // Aquí se puede agregar hash si usas bcrypt

    if (Object.keys(cambios).length === 0) {
        // Nada que actualizar
        const [userRows] = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [userId]);
        return res.render('auth/actualizar_cuenta', {
            title: 'Actualizar Cuenta',
            user: userRows[0],
            mensaje: 'No se proporcionaron cambios'
        });
    }

    const campos = [];
    const valores = [];
    for (const key in cambios) {
        campos.push(`${key} = ?`);
        valores.push(cambios[key]);
    }
    valores.push(userId);

    try {
        await pool.query(`UPDATE users SET ${campos.join(', ')} WHERE id = ?`, valores);

        // Volvemos a cargar el usuario actualizado para mostrar en la vista
        const [userRows] = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [userId]);

        res.render('auth/actualizar_cuenta', {
            title: 'Actualizar Cuenta',
            user: userRows[0],
            mensaje: 'Datos actualizados correctamente'
        });

    } catch (err) {
        console.error(err);
        const [userRows] = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [userId]);
        res.render('auth/actualizar_cuenta', {
            title: 'Actualizar Cuenta',
            user: userRows[0],
            mensaje: 'Ocurrió un error al actualizar'
        });
    }
});

module.exports = router;
