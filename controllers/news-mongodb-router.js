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
        const promise = db.authenticate(username, password);
        promise.then(user => done(null, user), error => done(error));
    }));

    passport.serializeUser((user, done) => {
        console.log(`STUB serializeUser(${user.name}) ...`);
        done(null, 'DUMMY_USER_ID');
    });

    passport.deserializeUser((id, done) => {
        console.log(`STUB deserializeUser(${id}) ...`);
        done(null, { name: 'DUMMY_USER' });
    });

    router.use('/', session({ secret: 'magic' }));
    router.use('/', passport.initialize());
    router.use('/', passport.session());

    router.use('/login', (req, res, next) => {
        function handler(error, user) {
            if (error || !user) {
                next(error || db.response(401, 'User could not be identified.'));
            }
            else {
                req.user = user;
                req.login(user, (err) => {
                    if (!err) {
                        res.status(200).send(`User ${user.name} is logged in.`);
                    }
                    else next(err);
                });
            }
        }
        console.log('passport.authenticate() ...');
        passport.authenticate('local', handler)(req, res, next);
    });

    router.use('/', (req, res, next) => {
        if (req.user) {
            console.log(`Authenticated user: ${req.user.name}`);
            next();
        }
        else next(db.response(401, 'Authentication is required.'));
    });

    // Create
    router.post('/', (req, res, next) => {
        res.locals.promise = db.add(req.body);
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
        res.locals.promise = db.update(req.params.id, req.body);
        next();
    });

    // Delete
    router.delete('/:id', (req, res, next) => {
        res.locals.promise = db.remove(req.params.id);
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
