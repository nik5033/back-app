const express = require("express");
const data = require('../database');
const passport = require('../passport').passport;
const config = require('../config/configs');

const router = express.Router();

const IsAuth = function (req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/login');
}

router.get('/api/user/out', (req, res) => {
    req.logout();
    res.send({success: true});
})

router.get('/api/user/check', (req, res) => {
    res.send({IsAuth: req.isAuthenticated()})
})

router.get('/api/user/login', (req, res) => {
    res.send({success: false, message: req.flash().error});
})

router.post('/api/user/login',passport.authenticate('login',{
    failureRedirect: '/api/user/login',
    failureFlash: 'Invalid username or password.',
}), (req, res) => {
    res.send({success: true, username: req.body.username, email: req.body.username})
});

router.post('/api/user/reg', (req, res) => {
    if(req.body.username && req.body.password){
        data.Find(req.body.username)
            .then(user => {
                if (user !== undefined && user !== null) {
                    res.send({success: false, message: "User exists"})
                }
                else{
                    data.CreateUser(req.body.username, req.body.password, config.user)
                        .then(user => {
                            res.send({success: true, message: "New user " + req.body.username})
                        })
                        .catch(e => {
                            res.send({success: false, message: e.toString()});
                        })
                }
            })
            .catch(e => {
                res.send({success: false, message: e.toString()})
            })


    }
    else{
        res.send({success: false, message: "Wrong request(without username and password)"})
    }
})

//note

router.delete('/api/note/rm', IsAuth, (req, res) => {
    data.Find(req.body.username)
        .then(user => {
            if (user !== undefined && user !== null){
                data.FindNote(req.body.username, req.body.id)
                    .then(note => {
                        if (note !== undefined && note !== null) {
                            data.RemoveNote(req.body.username, req.body.id)
                                .then(() => {
                                    res.send({success: true})
                                })
                                .catch(e => {
                                    console.log(e)
                                    res.send({success: false, message: e.toString()})
                                })
                        }
                        else {
                            res.send({success: false, message: "Not found"})
                        }
                    })
                    .catch(e => {
                        console.log(e)
                        res.send({success: false, message: e.toString()})
                    })
            }
            else {
                res.send({success: false, message: "User does not exist"});
            }
        })
        .catch(e => {
            console.log(e)
            res.send({success: false, message: e.toString()})
        })
})

router.post('/api/note/add', IsAuth, (req, res) => {
    let username = req.body.username;
    let title = req.body.title;
    let text = req.body.text;
    let date = req.body.date;

    data.Find(req.body.username)
        .then(user => {
            if (user !== undefined && user !== null) {
                data.AddNote(username, title, text, date)
                    .then(note => {
                        if (note !== undefined && note !== null) {
                            res.send({success: true, title: note.title, text: note.text, date: note.createdAt, id: note.id})
                        }
                        else {
                            res.send({success: false})
                        }
                    })
                    .catch(e => {
                        console.log(e)
                        res.send({success: false, message: e.toString()})
                    })
            }

            else {
                res.send({success: false, message: "User does not exist"});
            }
        })
        .catch(e => {
            console.log(e)
            res.json({success: false, message: e.toString()})
        })
})

router.get('/api/note/get', IsAuth, (req, res) => {
    let username = req.query.username;

    data.Find(username)
        .then(user => {
            if (user !== undefined && user !== null) {
                data.FindAllNotes(username)
                    .then(notes => {
                        if(notes === undefined || notes === null) {
                            res.send({success: false})
                        }
                        else {
                            let arr = new Map();
                            notes.forEach((item, i, notes) => {
                                arr.set(item.id, [item.title, item.text, item.createdAt])
                            })
                            res.send({success: true, notes: [...arr]})
                        }
                    })
                    .catch(e => {
                        console.log(e)
                        res.send({success: false, message: e.toString()})
                    })
            }
            else {
                res.send({success: false, message: "User does not exist"});
            }
        })


})

module.exports = router;