var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');
//get register
router.get('/register', function(req, res){
  res.render('register');
});

//get login
router.get('/login', function(req, res){
  res.render('login');
});

//post user
router.post('/register', function(req, res){
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  var client_customer_id = req.body.client_customer_id;
  var developer_token = req.body.developer_token;
  var oauth2_client_id = req.body.oauth2_client_id;
  var oauth2_client_secret = req.body.oauth2_client_secret;
  var oauth2_refresh_token = req.body.oauth2_refresh_token;

  //validation
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  req.checkBody('client_customer_id', 'Client Customer Id is required').notEmpty();
  req.checkBody('developer_token', 'Developer Token is required').notEmpty();
  req.checkBody('oauth2_client_id', 'OAuth2 Client Id is required').notEmpty();
  req.checkBody('oauth2_client_secret', 'OAuth2 Client Secret is required').notEmpty();
  req.checkBody('oauth2_refresh_token', 'OAuth2 Refresh Token is required').notEmpty();

  var errors = req.validationErrors();
  if(errors) {
    res.render('register', {
      errors:errors
    });
  } else {
    var newUser = new User({
      name: name,
      email: email,
      username: username,
      password: password,
      client_customer_id: client_customer_id,
      developer_token: developer_token,
      oauth2_client_id: oauth2_client_id,
      oauth2_client_secret: oauth2_client_secret,
      oauth2_refresh_token: oauth2_refresh_token
    });
    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);
    });

    req.flash('success_msg', 'You are registered and can now login');
    res.redirect('/users/login');
  }
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }
      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, {message: 'Invalid password'});
        }
      });
    });
  }));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
  });

  router.post('/login',
  passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true}),
  function(req, res) {
    res.redirect('/');
  });

  router.get('/logout', function(req, res) {
    req.logout();

    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });

  module.exports = router;
