/*
 * Define App server, database and Authentication
 */
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const config = require("./config");
const mongoose = require("mongoose");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

// Load User model
const User = require("./models/User");

//Load Routers
const usersRouter = require('./routes/users');
const apartmentsRouter = require('./routes/apartments');

// connect to database
const db = config.mongoURI;
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  if (err){
    console.log('Could not connect to MongoDB');
    return;
  }
});

//Intitialize Express
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//Express setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use('/users', usersRouter);
app.use('/apartments', apartmentsRouter);

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
  res.send({error: err});
});

//passport authentication setup
var options = {}
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
options.secretOrKey = config.secretOrKey;

// Configure Passport to use local strategy for initial authentication.
passport.use('local', new LocalStrategy(User.authenticate()));
 
// Configure Passport to use JWT strategy to look up Users.
passport.use('jwt', new JwtStrategy(options, function(jwt_payload, done) {
  User.findOne({
    _id: jwt_payload.id
  }, function(err, user) {
    if (err) {
      return done(err, false);
    }
    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  })
}));

const port = config.port;
app.listen(port, () => console.log(`Server up and running on port ${port} !`));

module.exports = app;
