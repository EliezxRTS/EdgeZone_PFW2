function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send("Acceso denegado: Solo administradores");
    }
    next();
}

module.exports = requireAdmin;
