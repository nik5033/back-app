const express = require("express");
const Connect = require('./database').Connect;
const Create = require('./database').CreateUser;
const FindById = require('./database').FindById;
const routes = require('./routes/routes');
const bodyParser = require('body-parser');
const passport = require('passport');
const Cookie = require('cookie-parser');
const session = require('express-session');
require('./models/user');
const flash = require('connect-flash');
const config = require('./config/configs')

const PORT = process.env.PORT || 4444
const app = express();

app.use(express.static( __dirname + '/public'));
app.set('view engine', 'pug');

app.use(session({
    secret: config.secretKey,
    resave: true,
    secure: false,
    saveUninitialized: true,
    maxAge: 1000 * 3600
}))
app.use(Cookie());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended:  true }))
app.use('/', routes);

app.listen(PORT, () =>{
    Connect()
        .then(() =>{
            console.log('Connected');
            FindById(config.admin_id)
                .then(user => {
                    if(user !== undefined && user !== null){
                        console.log("Admin has been already created.");
                    }
                    else{
                        Create(config.admin_username,config.admin_password, config.admin)
                            .then(u => {
                                console.log("Admin was created");
                            })
                            .catch(e => {
                                console.log("Error: " + e);
                            })
                    }
                })
                .catch(e => {
                    console.log("Error: " + e);
                })
        })
        .catch(e => {
            console.log('Not connected');
        });
});