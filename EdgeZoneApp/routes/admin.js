const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireLogin = require('../middlewares/auth');
const requireAdmin = require('../middlewares/admin');

// Panel de admin: mostrar tabla seleccionada si hay, sino vista inicial
router.get('/', requireLogin, requireAdmin, async (req, res) => {
    const { tabla } = req.query; // viene del select en el panel

    // Si no se seleccionó tabla, renderizamos vista inicial
    if (!tabla) {
        return res.render('admin/panel_admin', { title: 'Panel de Administrador' });
    }

    // Validación de tabla permitida
    if (!['users','partidas','miniaturas'].includes(tabla)) {
        return res.status(400).send('Tabla no permitida');
    }

    try {
        const [registros] = await pool.query('SELECT * FROM ?? ORDER BY id DESC', [tabla]);
        res.render('admin/panel_admin', { 
            title: `CRUD ${tabla}`, 
            tabla, 
            registros 
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error al cargar la tabla');
        res.render('admin/panel_admin', { title: 'Panel de Administrador' });
    }
});

// Formulario para agregar nuevo registro
router.get('/alta/:tabla', requireLogin, requireAdmin, async (req, res) => {
    const tabla = req.params.tabla;
    // obtener los campos dinámicamente
    const [rows] = await pool.query(`DESCRIBE ${tabla}`);
    const campos = rows.map(r => r.Field).filter(f => f !== 'id'); // omitimos el id
    res.render('admin/alta_registro', { title: `Nuevo registro en ${tabla}`, tabla });
});

// Guardar nuevo registro
router.post('/alta/:tabla', requireLogin, requireAdmin, async (req, res) => {
    const tabla = req.params.tabla;
    const campos = Object.keys(req.body);
    const valores = Object.values(req.body);

    const placeholders = campos.map(() => '?').join(',');
    const query = `INSERT INTO ${tabla} (${campos.join(',')}) VALUES (${placeholders})`;

    await pool.query(query, valores);
    res.redirect(`/admin/tabla/${tabla}`);
});

// Formulario para editar registro
router.get('/editar/:tabla/:id', requireLogin, requireAdmin, async (req, res) => {
    const { tabla, id } = req.params;
    const [registro] = await pool.query(`SELECT * FROM ${tabla} WHERE id = ?`, [id]);
    if (!registro.length) return res.status(404).send('Registro no encontrado');
    res.render('admin/editar_registro', { title: `Editar ${tabla}`, tabla, registro: registro[0] });
});

// Guardar edición
router.post('/editar/partidas/:id', requireLogin, requireAdmin, async (req, res) => {
    const id = req.params.id;
    const { nombre_juego, nombre_partida, resultado, descripcion, fecha_jugada } = req.body;

    // Transformar a formato MySQL
    const fechaSQL = fecha_jugada ? fecha_jugada.replace('T', ' ') + ':00' : null;

    await pool.query(
        `UPDATE partidas 
         SET nombre_juego = ?, nombre_partida = ?, resultado = ?, descripcion = ?, fecha_jugada = ?
         WHERE id = ?`,
        [nombre_juego, nombre_partida, resultado, descripcion, fechaSQL, id]
    );

    req.flash('success_msg', 'Partida actualizada correctamente.');
    res.redirect('/admin?tabla=partidas');
});

// Borrar registro
router.post('/borrar/:tabla/:id', requireLogin, requireAdmin, async (req, res) => {
    const { tabla, id } = req.params;
    await pool.query(`DELETE FROM ${tabla} WHERE id = ?`, [id]);
    res.redirect(`/admin/tabla/${tabla}`);
});

module.exports = router;
