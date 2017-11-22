const express      = require('express');
const session      = require('express-session');
const { Passport } = require('passport');
const { Strategy } = require('passport-local');
const NewsMongodb  = require('../services/news-mongodb.js');


function createRouter(settings) {
    const router   = express.Router();
    const db       = new NewsMongodb(settings);
    const passport = new Passport();


    passport.use(new Strategy((username, password, done) => {
        db.authenticate(username, password).then(usr => done(null, usr), err => done(err));
    }));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((idUser, done) => done(null, { id: idUser }));

    router.use('/', session({ secret: 'magic' }));
    router.use('/', passport.initialize());
    router.use('/', passport.session());

    router.post('/login', (req, res, next) => {
        passport.authenticate('local', (error, user) => {
            if (!error && user) {
                req.login(user, (err) => {
                    if (!err) {
                        res.status(200).json(db.response(200, `User "${user.id}" is logged in.`));
                    }
                    else next(err);
                });
            }
            else next(error || db.response(401, 'No expected credentials are received.'));
        })(req, res, next);
    });

    router.use('/', (req, res, next) => {
        next(req.user ? 'route' : db.response(401, 'Authentication was not fulfilled so far.'));
    });

    // Create
    router.post('/', (req, res, next) => {
        res.locals.promise = db.add(req.body, req.user);
        next();
    });

    // Read
    router.get('/', (req, res, next) => {
        res.locals.promise = db.get(req.query);
        next();
    });

    // Read
    router.get('/:id', (req, res, next) => {
        req.query.id = req.params.id;
        res.locals.promise = db.get(req.query);
        next();
    });

    // Update
    router.put('/:id', (req, res, next) => {
        res.locals.promise = db.update(req.params.id, req.body, req.user);
        next();
    });

    // Delete
    router.delete('/:id', (req, res, next) => {
        res.locals.promise = db.remove(req.params.id, req.user);
        next();
    });

    router.use('/', (req, res, next) => {
        const p = res.locals.promise;
        !p ? next() : p.then(v => res.status(v.httpCode).json(v), r => next(r));
    });

    router.use('/', (err, req, res, next) => {
        NewsMongodb.isOwn(err) ? res.status(err.httpCode).json(err) : next(err);
    });

    return router;
}

module.exports = createRouter;
