var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const session = require('express-session');
const flash = require('connect-flash');

// Routers
var homeRouter = require('./routes/home');
var galeriaRouter = require('./routes/galeria');
var partidasRouter = require('./routes/partidas');
var authRouter = require('./routes/auth');
var adminRouter = require('./routes/admin');
var cuentaRouter = require('./routes/cuenta');

// Inicializar app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// --- Helpers de Handlebars ---
const hbs = require('hbs');

hbs.registerHelper('addOne', function(value) {
    return parseInt(value) + 1;
});

hbs.registerHelper('formatDate', function(datetime) {
    const d = new Date(datetime);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
});

hbs.registerHelper('formatDatetimeLocal', function(datetime) {
    if (!datetime) return '';
    const d = new Date(datetime);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
});

// Helper para obtener las keys de un objeto
hbs.registerHelper('keys', function(obj) {
    return Object.keys(obj);
});

// Incrementa un valor numérico
hbs.registerHelper('increment', function(value) {
    return parseInt(value) + 1;
});

// Decrementa un valor numérico
hbs.registerHelper('decrement', function(value) {
    return parseInt(value) - 1;
});

// Compara igualdad
hbs.registerHelper('eq', function(a, b) {
    return a === b;
});

// Compara mayor que
hbs.registerHelper('gt', function(a, b) {
    return a > b;
});

// Compara menor que
hbs.registerHelper('lt', function(a, b) {
    return a < b;
});

// Genera un rango de números desde `start` hasta `end` (inclusive)
hbs.registerHelper('range', function(start, end) {
    const arr = [];
    for (let i = parseInt(start); i <= parseInt(end); i++) {
        arr.push(i);
    }
    return arr;
});

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sesión y flash
app.use(session({
    secret: 'edgezone_secret_key',
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

// Variables globales para todas las vistas
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.user = req.session.user || null;
    next();
});

// Montaje de rutas
app.use('/', homeRouter);              // Página inicial
app.use('/galeria', galeriaRouter);    // Galería
app.use('/partidas', partidasRouter);  // Partidas
app.use('/auth', authRouter);          // Login / Registro
app.use('/admin', adminRouter);        // Panel admin
app.use('/cuenta', cuentaRouter);      // Cuenta de usuario

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
