var express = require('express');
var router = express.Router();
var pool = require('../db');
const requireLogin = require('../middlewares/auth');

// Ruta pública: últimas 15 partidas
router.get('/recientes', async (req, res) => {
    const [partidas] = await pool.query(
        `SELECT p.id, p.nombre_juego, p.nombre_partida, p.resultado, p.descripcion,
                u.username AS jugador, p.fecha_jugada
         FROM partidas p
         JOIN users u ON p.usuario_id = u.id
         ORDER BY p.fecha_jugada DESC
         LIMIT 15`
    );

    res.render('partidas/recientes', {
        title: 'Partidas Recientes',
        partidas
    });
});

// Ruta privada: mis partidas
router.get('/mis-partidas', requireLogin, async (req, res) => {
    const userId = req.session.user.id;
    const [misPartidas] = await pool.query(
        `SELECT p.id, p.nombre_juego, p.nombre_partida, p.resultado, p.descripcion,
                p.fecha_jugada
         FROM partidas p
         WHERE p.usuario_id = ?
         ORDER BY p.fecha_jugada DESC`,
        [req.session.user.id]
    );

    res.render('partidas/mis-partidas', {
        title: 'Mis Partidas',
        partidas: misPartidas,
        user: req.session.user
    });
});

// Formulario nueva partida
router.get('/alta_partidas', requireLogin, (req, res) => {
    res.render('partidas/alta_partidas', {
        title: 'Registrar Partida',
        user: req.session.user
    });
});

// Guardar partida
router.post('/guardar', requireLogin, async (req, res) => {

    const nuevaPartida = {
        nombre_juego: req.body.nombre_juego,
        nombre_partida: req.body.nombre_partida || null,
        usuario_id: req.session.user.id,
        resultado: req.body.resultado || null,
        descripcion: req.body.descripcion || null
    };

    await pool.query(
        `INSERT INTO partidas (nombre_juego, nombre_partida, usuario_id, resultado, descripcion)
         VALUES (?, ?, ?, ?, ?)`,
        [
            nuevaPartida.nombre_juego,
            nuevaPartida.nombre_partida,
            nuevaPartida.usuario_id,
            nuevaPartida.resultado,
            nuevaPartida.descripcion
        ]
    );

    res.render('partidas/confirmacion', {
        title: 'Partida Guardada',
        partida: nuevaPartida
    });
});

// Mostrar formulario para editar partida
router.get('/editar/:id', requireLogin, async (req, res) => {
    const partidaId = req.params.id;
    const userId = req.session.user.id;

    const [rows] = await pool.query(
        `SELECT * FROM partidas WHERE id = ? AND usuario_id = ?`,
        [partidaId, userId]
    );

    if (!rows.length) {
        return res.status(404).send("Partida no encontrada o no autorizada");
    }

    res.render('partidas/editar_partida', {
        title: 'Editar Partida',
        partida: rows[0]
    });
});

// Procesar actualización
router.post('/editar/:id', requireLogin, async (req, res) => {
    const partidaId = req.params.id;
    const userId = req.session.user.id;
    const cambios = {};

    if (req.body.nombre_juego && req.body.nombre_juego.trim() !== '') cambios.nombre_juego = req.body.nombre_juego.trim();
    if (req.body.nombre_partida && req.body.nombre_partida.trim() !== '') cambios.nombre_partida = req.body.nombre_partida.trim();
    if (req.body.resultado && req.body.resultado.trim() !== '') cambios.resultado = req.body.resultado.trim();
    if (req.body.descripcion && req.body.descripcion.trim() !== '') cambios.descripcion = req.body.descripcion.trim();

    if (Object.keys(cambios).length === 0) {
        return res.redirect(`/partidas/editar/${partidaId}?mensaje=No hay cambios`);
    }

    const campos = [];
    const valores = [];
    for (const key in cambios) {
        campos.push(`${key} = ?`);
        valores.push(cambios[key]);
    }
    valores.push(partidaId, userId);

    try {
        await pool.query(
            `UPDATE partidas SET ${campos.join(', ')} WHERE id = ? AND usuario_id = ?`,
            valores
        );
        res.redirect(`/partidas/mis-partidas`);
    } catch (err) {
        console.error(err);
        res.redirect(`/partidas/editar/${partidaId}?mensaje=Error al actualizar`);
    }
});

// Confirmar y borrar partida
router.post('/borrar/:id', requireLogin, async (req, res) => {
    const partidaId = req.params.id;
    const userId = req.session.user.id;

    try {
        await pool.query(
            `DELETE FROM partidas WHERE id = ? AND usuario_id = ?`,
            [partidaId, userId]
        );
        res.redirect('/partidas/mis-partidas');
    } catch (err) {
        console.error(err);
        res.redirect('/partidas/mis-partidas');
    }
});

module.exports = router;
