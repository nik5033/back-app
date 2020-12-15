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
    res.send({success: true, username: req.body.username})
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

router.delete('/api/note/rm', (req, res) => {
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

router.post('/api/note/add', (req, res) => {
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
                            res.send({success: true, message: "Note " + note.title + "was added"})
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

router.get('/api/note/get', (req, res) => {
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
                                arr.set(item.id, [item.title, item.text, item.data])
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

//READ
router.get('/rest_api', IsAuth, (req, res) => {
    if(!req.query.id){
        res.json({success: false, message: "Wrong request(without id)"})
    }
    else{
        data.FindById(req.query.id)
            .then(user => {
                if(user !== undefined && user !== null) {
                    res.send({success: true, username: user.username, admin: user.admin})
                }
                else{
                    res.send({success: false, message: "User does not exist"})
                }
            })
            .catch(e => {
                console.log(e)
                res.send({success: true, message: e.toString()})
            })
    }
})

//DELETE
router.delete('/rest_api',IsAuth ,(req, res) => {
    if(!req.query.id){
        res.json({success: false, message: "Wrong request(without id)"})
    }
    else{
        if(req.user.admin){
            data.FindById(req.query.id)
                .then(user => {
                    if(user !== undefined && user !== null){
                        data.Delete(req.query.id)
                            .then(user => {
                                res.json({success: true})
                            })
                            .catch(e => {
                                console.log("Error: " + e);
                                res.json({success: false, message: e});
                            })
                    }
                    else{
                        res.json({success: false, message: "User does not exist"});
                    }
                })
                .catch(e => {
                    res.json({success: false, message: e.toString()});
                })
        }
        else{
            res.json({success: false, message: "You are not an admin"})
        }
    }
})

//UPDATE
router.put('/rest_api', IsAuth, (req, res) => {
    if(req.query.id && (req.query.username || req.query.password)){
        if(req.user.admin || req.query.id == req.user.id){
            data.FindById(req.query.id)
                .then(user => {
                    if(user !== undefined && user !== null){
                        if(req.query.username){
                            data.UpdateUsername(req.query.id, req.query.username)
                                .then(user => {
                                    //flag = true
                                })
                                .catch(e => {
                                    res.json({success: false, message: e.toString()});
                                })
                        }
                        if(req.query.password){
                            data.UpdatePassword(req.query.id, req.query.password)
                                .then(user => {
                                    //flag = true
                                })
                                .catch(e => {
                                    res.json({success: false, message: e.toString()});
                                })
                        }
                        res.json({success: true});
                    }
                    else{
                        res.json({success: false, message: "User does not exist"});
                    }

                })
                .catch(e => {
                    res.json({success: false, message: e.toString()});
                })
        }
        else{
            res.json({success: false, message: "You are not an admin"})
        }
    }
    else{
        res.json({success: false, message: "Wrong request(without id and username/password)"})
    }
})

module.exports = router;