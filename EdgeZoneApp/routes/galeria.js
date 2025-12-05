const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireLogin = require('../middlewares/auth');

// Helper para paginación
function paginate(array, page_size, page_number) {
  // human-readable page numbers -> 1-based
  return array.slice((page_number - 1) * page_size, page_number * page_size);
}

// Ruta pública: galería principal con paginación (16 cards por página)
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  const [miniaturas] = await pool.query(
    `SELECT m.id, m.nombre, m.coleccion, m.imagen_url, m.descripcion, m.fecha_subida,
            u.username AS autor
     FROM miniaturas m
     JOIN users u ON m.usuario_id = u.id
     ORDER BY m.fecha_subida DESC`
  );

  const totalPages = Math.ceil(miniaturas.length / 16);
  const miniaturasPage = paginate(miniaturas, 16, page);

  res.render('galeria/galeria', {
    title: 'Galería EdgeZone',
    miniaturas: miniaturasPage,
    currentPage: page,
    totalPages
  });
});

// Ruta privada: galería personal del usuario
router.get('/mi_galeria', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  
  // Paginación
  const page = parseInt(req.query.page) || 1;
  const limit = 16;
  const offset = (page - 1) * limit;

  try {
    // Contar total de miniaturas del usuario
    const [total] = await pool.query(
      'SELECT COUNT(*) AS count FROM miniaturas WHERE usuario_id = ?',
      [userId]
    );

    const totalItems = total[0].count;
    const totalPages = Math.ceil(totalItems / limit);

    // Traer miniaturas del usuario
    const [misMiniaturas] = await pool.query(
      `SELECT id, nombre, coleccion, imagen_url, descripcion, fecha_subida
       FROM miniaturas
       WHERE usuario_id = ?
       ORDER BY fecha_subida DESC
       LIMIT ? OFFSET ?`,
       [userId, limit, offset]
    );

    res.render('galeria/mi_galeria', {
      title: 'Mi Galería',
      miniaturas: misMiniaturas,
      currentPage: page,
      totalPages,
      user: req.session.user
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar tu galería');
  }
});

// Formulario para agregar nueva miniatura
router.get('/alta_galeria', requireLogin, (req, res) => {
  res.render('galeria/alta_galeria', {
    title: 'Agregar Miniatura',
    user: req.session.user
  });
});

// Guardar miniatura nueva
router.post('/guardar', requireLogin, async (req, res) => {
  const nuevaMiniatura = {
    nombre: req.body.nombre,
    coleccion: req.body.coleccion || null,
    descripcion: req.body.descripcion || null,
    usuario_id: req.session.user.id,
    imagen_url: req.body.imagen_url || null
  };

  await pool.query(
    `INSERT INTO miniaturas (nombre, coleccion, usuario_id, imagen_url, descripcion)
     VALUES (?, ?, ?, ?, ?)`,
    [
      nuevaMiniatura.nombre,
      nuevaMiniatura.coleccion,
      nuevaMiniatura.usuario_id,
      nuevaMiniatura.imagen_url,
      nuevaMiniatura.descripcion
    ]
  );

  res.render('galeria/confirmacion', {
    title: 'Miniatura Guardada',
    miniatura: nuevaMiniatura
  });
});

// Formulario para editar una miniatura
router.get('/editar/:id', requireLogin, async (req, res) => {
  const miniaturaId = req.params.id;
  const userId = req.session.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, coleccion, imagen_url, descripcion
       FROM miniaturas
       WHERE id = ? AND usuario_id = ?`,
      [miniaturaId, userId]
    );

    if (!rows.length) {
      return res.status(404).send("Miniatura no encontrada o no tienes permiso");
    }

    res.render('galeria/editar_miniatura', {
      title: 'Editar Miniatura',
      miniatura: rows[0],
      user: req.session.user,
      mensaje: null
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar la miniatura");
  }
});

// Procesar actualización de miniatura
router.post('/editar/:id', requireLogin, async (req, res) => {
  const miniaturaId = req.params.id;
  const userId = req.session.user.id;
  const cambios = {};

  if (req.body.nombre && req.body.nombre.trim() !== '') cambios.nombre = req.body.nombre.trim();
  if (req.body.coleccion && req.body.coleccion.trim() !== '') cambios.coleccion = req.body.coleccion.trim();
  if (req.body.descripcion && req.body.descripcion.trim() !== '') cambios.descripcion = req.body.descripcion.trim();
  if (req.body.imagen_url && req.body.imagen_url.trim() !== '') cambios.imagen_url = req.body.imagen_url.trim();

  if (Object.keys(cambios).length === 0) {
    return res.render('galeria/editar_miniatura', {
      title: 'Editar Miniatura',
      miniatura: { id: miniaturaId, ...req.body },
      user: req.session.user,
      mensaje: 'No se proporcionaron cambios'
    });
  }

  const campos = [];
  const valores = [];
  for (const key in cambios) {
    campos.push(`${key} = ?`);
    valores.push(cambios[key]);
  }
  valores.push(miniaturaId, userId);

  try {
    await pool.query(
      `UPDATE miniaturas SET ${campos.join(', ')} WHERE id = ? AND usuario_id = ?`,
      valores
    );

    const [rows] = await pool.query(
      `SELECT id, nombre, coleccion, imagen_url, descripcion
       FROM miniaturas
       WHERE id = ? AND usuario_id = ?`,
      [miniaturaId, userId]
    );

    res.render('galeria/editar_miniatura', {
      title: 'Editar Miniatura',
      miniatura: rows[0],
      user: req.session.user,
      mensaje: 'Miniatura actualizada correctamente'
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar la miniatura");
  }
});

// Borrar miniatura
router.post('/borrar/:id', requireLogin, async (req, res) => {
  const miniaturaId = req.params.id;
  const userId = req.session.user.id;

  try {
    await pool.query(
      `DELETE FROM miniaturas WHERE id = ? AND usuario_id = ?`,
      [miniaturaId, userId]
    );

    res.redirect('/galeria/mi_galeria');

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al borrar la miniatura");
  }
});

module.exports = router;
