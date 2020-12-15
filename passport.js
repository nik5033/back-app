const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Find = require('./database').Find;
const bcrypt = require('bcryptjs');
const FindById = require('./database').FindById;
const CreateUser = require('./database').CreateUser;
const GetPassword = require('./database').GetPassword;
const config = require('./config/configs');

const SignInStrategy = new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallBack: true,
    failureFlash: true
}, function (username, password, done){
    Find(username)
        .then(user => {
            if(user !== undefined && user !== null) {
                GetPassword(username)
                    .then(pass => {
                        bcrypt.compare(password, pass)
                            .then((result) => {
                                if (result) {
                                    return done(null, user);
                                }
                                return done(null, false, {message: 'Incorrect'});
                            })
                    })
                    .catch(e => {
                        console.log("Login error: " + e);
                    })
            }
            else{
               return done(null, false, {message: "Incorrect"});
            }
        }
        )
        .catch(e => {
            console.log("Login error: " + e);
        })
})

const SingUpStrategy = new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallBack: true
}, function(username, password, done) {
    UserExists(username)
        .then(yes =>{
            if(yes){
                return done(null, false, {message: "User already exist"});
            }
            else{
                    CreateUser(username, password, config.user)
                        .then(user => {
                            return done(null, user);
                        })
                        .catch(e => {console.log("Register error: " + e)})
            }
        })
        .catch(e =>{console.log("Error: " + e)})
})

passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser((id, done) => {
    FindById(id)
        .then((user) => {
            done(null, user);
        })
})

passport.use('login', SignInStrategy);
passport.use('reg', SingUpStrategy);

exports.passport = passport;