var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var crypto = require('crypto');//used to reset token on forgot password

var nodemailer = require('nodemailer')
var handlebars = require('express-handlebars');
var bcrypt = require('bcryptjs');
var flash = require('express-flash');
var async = require('async');
const passport = require('passport');
const session = require('express-session');

const port = process.env.PORT || 3003;// .env should be in a seperate file for security reasons/port no this case 3003
const mongoURL = process.env.MONGOURL || 'mongodb+srv://mike:DIgitalcat14!@cluster0-fssfj.mongodb.net/Pacman-515?retryWrites=true&w=majority';//atlas database link

const { isAuth } = require('./middleware/isAuth');
require('./middleware/passport')(passport);

//includes user model for database entries
const User = require('./models/User');

app.use(express.static('public'));
app.use(cookieParser());
app.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
        cookie: { maxAge: 60000 }
    })
);
app.use(flash());//tried using this for message feedback from bottons
app.use(passport.initialize());
app.use(passport.session());
//We Use body Parser to structure the request into a format that is simple to use
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
//use app.set to tell express to use handlebars as our view engine
app.set('view engine', 'hbs');
//Pass some additional information to handlebars to that is can find our layouts folder, and allow
//us to use the .hbs extension for our files.
app.engine('hbs', handlebars({
    layoutsDir: __dirname + '/views/layouts',
    extname: 'hbs'
}))


//index page, landing page
app.get('/', (req, res) => {
    try {
        res.render('login', { layout: 'main', user: req.user });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }

})

//sign out of current page, takes to login screen
app.get('/signout', (req, res) => {
    //Logs the logged in user out and redirects to the sign in page
    req.logout();
    res.redirect('/');
})

app.get('/forgot', (req, res) => {
    res.render('forgotPass', {layout: 'resetPass',
      user: req.user
    });
  });

  app.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
          //   console.log('error', 'No account with that email address exists.');
          req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  console.log('step 1')
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
          console.log('step 2')
  
  
        var smtpTrans = nodemailer.createTransport({
           service: 'Gmail', 
           auth: {
            user: 'austinfury3@gmail.com',
            pass: 'Toffee2015'
          }
        });
        var mailOptions = {
  
          to: user.email,
          from: 'austinfury2@gmail.com',
          subject: 'Node.js Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
  
        };
        console.log('step 3')
  
          smtpTrans.sendMail(mailOptions, function(err) {
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          console.log('sent')
          res.redirect('/forgot');
  });
  }
    ], function(err) {
      console.log('this err' + ' ' + err)
      res.redirect('/');
    });
  });
  
  app.get('/forgot', function(req, res) {
    res.render('forgot', {
      User: req.user
    });
  });

  app.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        console.log(user);
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {
       User: req.user
      });
    });
  });
  
  
  
  
  app.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user, next) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
  
  
          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;
          console.log('password' + user.password  + 'and the user is' + user)
  
  user.save(function(err) {
    if (err) {
        console.log('here')
         return res.redirect('back');
    } else { 
        console.log('here2')
      req.logIn(user, function(err) {
        done(err, user);
      });
  
    }
          });
        });
      },
  
  
  
  
  
      function(user, done) {
          // console.log('got this far 4')
        var smtpTrans = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'austinfury3@gmail.com',
            pass: 'Toffee2015'
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'austinfury3@gmail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            ' - This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTrans.sendMail(mailOptions, function(err) {
          // req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/');
    });
  });
//when not needing a player name this redirects button to Pacman game.
app.get('/PacMan', isAuth, (req, res) => {
    res.render('PacMan', {layout: 'pacman',
        user: req.user
      });
    });
//user password reset tokens 
app.get('/reset/:token', function(req, res) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
          }
          res.render('reset', {token: req.params.token});
        });
      });
      
     app.post('/reset/:token', function(req, res) {
        async.waterfall([
          function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { get: Date.now() } }, function(err, user) {
              if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('back');
              }
              if(req.body.password === req.body.confirm) {
                user.setPassword(req.body.password, function(err) {
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpires = undefined;
      
                  user.save(function(err) {
                    req.logIn(user, function(err) {
                      done(err, user);
                    });
                  });
                })
              } else {
                  req.flash("error", "Passwords do not match.");
                  return res.redirect('back');
              }
            });
          },
          function(user, done) {
            var smtpTransport = nodemailer.createTransport({
              service: 'Gmail', 
              auth: {
                type: 'OAuth2',
                user: 'austinfury3@gmail.com',
                pass: 'Toffee2015'
              }
            });
            var mailOptions = {
              to: user.email,
              from: 'learntocodeinfo@mail.com',
              subject: 'Your password has been changed',
              text: 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
              req.flash('success', 'Success! Your password has been changed.');
              done(err);
            });
          }
        ], function(err) {
          res.redirect('/login');
        });
      });
      
//new user Signup
app.post('/signup', async (req, res) => {
    const { email, username, password, highscore } = req.body;
    try {
        let user = await User.findOne({ username });
        //If user exists stop the process and render login view with userExist true
        if (user) {
            return res.status(400).render('login', { layout: 'main', userExist: true });
        }
        //If user does not exist, then continue
        user = new User({
            user: req.user,
            email,
            username: req.body.username,
            password: req.body.password,
            highscore
        });
        //Salt Generation
        const salt = await bcrypt.genSalt(10);
        //Password Encryption using password and salt
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.status(200).render('login', { layout: 'main', userDoesNotExist: true });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }
})
//sign in
app.post('/signin', (req, res, next) => {
    try {
        passport.authenticate('local', {
            successRedirect: '/PacMan', user: req.user,
            failureRedirect: '/?incorrectLogin'
        })(req, res, next)
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }

})



//mongo db connection

mongoose.connect(mongoURL, {
    useUnifiedTopology: true,
    useNewUrlParser: true
})
    .then(() => {
        console.log('connected to DB')//Upon Successful connection, we are using a Javasctipt .then block here to give us a message in in our console 
    })
    .catch((err) => {
        console.log('Not Connected to DB : ' + err);//Upon unuccessful connection, we are using a Javasctipt .catch block here to give us a message in in our console with err displayed so that we can see what the issue is.
    });

//Listening for requests on port 3003
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});