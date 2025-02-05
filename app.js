const express = require('express');
const bcrypt = require('bcrypt');
const csrf = require('csurf');
const bodyParser = require('body-parser');
const { User } = require('./models');
const { ensureAuthenticated, ensureAdmin } = require('./roleauth');
const playerRoutes = require('./playerRoutes');
const adminRoutes = require('./adminRoutes');


const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

const saltRounds = 10;
const flash = require('connect-flash');
const passport = require("passport");

const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'my-secret-key-12345678',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(csrf({ cookie: true }));
app.use(flash());
app.use('/player', playerRoutes);
app.use('/admin', adminRoutes);

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
}, async (username, password, done) => {
  try {
    const user = await User.findOne({ where: { email: username } });
    if (!user) {
      return done(null, false, { message: 'User not found' });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid password' });
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});



app.use((req, res, next) => {
  res.locals.errorMessage = req.flash('error');
  next();
});

app.get('/signup', (req, res) => {
  console.log(req.csrfToken());
  const errors = req.flash('error');
  res.render('signup', { csrfToken: req.csrfToken(), errors });
});
app.get('/', (req, res) => {

  res.render('index');
});


app.post('/signup', async (req, res) => {
  const { Name, email, password, password2, role } = req.body;
  let errors = [];

  if (!Name || !email || !password || !password2) {
    errors.push('Please fill in all fields.');
  }
  if (password !== password2) {
    errors.push('Passwords do not match.');
  }
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  if (errors.length > 0) {
    return res.render('signup', { errors, csrfToken: req.csrfToken() });
  }

  try {
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      errors.push('Email is already registered.');
      return res.render('signup', { errors, csrfToken: req.csrfToken() });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await User.create({ Name, email, role, password: hashedPassword });
    req.flash('success_msg', 'You are registered and can log in.');
    const errors = req.flash('error');
    res.render('login', { csrfToken: req.csrfToken(), errors });
  } catch (err) {
    console.error(err);
    res.redirect('/signup');
  }
});


app.get('/login', (req, res) => {
  const errors = req.flash('error');
  res.render('login', { csrfToken: req.csrfToken(), errors });
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true,
}), (req, res) => {
  console.log('User role:', req.user.role);

  if (req.user && req.user.role) {
    if (req.user.role.toLowerCase() === 'admin') {
      res.redirect('/admin/dashboard');
    } else if (req.user.role.toLowerCase() === 'player') {
      res.redirect('/player/dashboard');
    } else {
      res.status(403).send('Invalid role');
    }
  } else {
    res.status(403).send('User role not defined');
  }
});


app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).send('Form tampered with or invalid CSRF token.');
  } else {
    next(err);
  }
});
app.get('/test', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Authenticated');
  } else {
    res.send('Not authenticated');
  }
});




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

module.exports = app;



