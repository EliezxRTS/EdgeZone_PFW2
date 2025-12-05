var express = require('express');
var router = express.Router();
const pool = require('../db'); // tu conexión MySQL

/* GET home page con feed de recientes */
router.get('/', async (req, res) => {
    try {
        // 1️⃣ Últimas 5 partidas registradas
        const [partidas] = await pool.query(
            'SELECT p.id, p.nombre_juego, p.nombre_partida, p.resultado, p.descripcion, u.username AS jugador, p.fecha_jugada ' +
            'FROM partidas p ' +
            'JOIN users u ON p.usuario_id = u.id ' +
            'ORDER BY p.fecha_jugada DESC ' +
         'LIMIT 5'
        );


        // 2️⃣ Últimas 5 miniaturas subidas
        const [miniaturas] = await pool.query(
            'SELECT m.id, m.nombre, m.imagen_url, u.username AS autor, m.fecha_subida ' +
            'FROM miniaturas m ' +
            'JOIN users u ON m.usuario_id = u.id ' +
            'ORDER BY m.fecha_subida DESC ' +
            'LIMIT 5'
        );

        // Renderizar la vista Home con los datos
        res.render('home', {
            title: 'Home - EdgeZone',
            active: 'home',
            partidas,
            miniaturas,
            user: req.session.user || null
        });

    } catch (error) {
        console.error('Error cargando feed:', error);
        res.render('home', {
            title: 'Home - EdgeZone',
            active: 'home',
            partidas: [],
            miniaturas: [],
            user: req.session.user || null,
            error_msg: 'No se pudieron cargar los últimos registros.'
        });
    }
});

module.exports = router;
