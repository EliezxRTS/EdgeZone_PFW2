module.exports = function requireLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error_msg', 'Debes iniciar sesión primero.');
        return res.redirect('/auth/login');
    }
    next();
}
