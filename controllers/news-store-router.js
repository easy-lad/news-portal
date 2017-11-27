const express      = require('express');
const { Passport } = require('passport');
const Strategy     = require('passport-http').BasicStrategy;
const NewsMemory   = require('../services/news-memory.js');


function createRouter() {
    const router   = express.Router();
    const store    = new NewsMemory({ title: 'test entry', summary: 'automatically created for test purposes', who: 'server' });
    const passport = new Passport();

    passport.use(new Strategy((username, password, done) => {
        const promise = store.authenticate(username, password);
        promise.then(user => done(null, user), error => done(error));
    }));

    router.use('/', passport.initialize());

    router.use('/', (req, res, next) => {
        function handler(error, user) {
            if (error || !user) {
                res.set('www-authenticate', 'Basic realm="users"');
                next(error || { from: store, code: 401, text: 'Apparently, no "authorization" header was provided.' });
            }
            else {
                req.user = user;
                next();
            }
        }
        passport.authenticate('basic', handler)(req, res, next);
    });

    // Create
    router.post('/', (req, res) => {
        res.status(201).send(store.add(req.body, req.user));
    });

    // Read
    router.get('/', (req, res) => {
        res.status(200).json(store.get('all', 'short' in req.query));
    });

    // Read
    router.get('/:id', (req, res) => {
        res.status(200).json(store.get(req.params.id, 'short' in req.query));
    });

    // Update
    router.put('/:id', (req, res) => {
        res.status(200).send(store.update(req.params.id, req.body, req.user));
    });

    // Delete
    router.delete('/:id', (req, res) => {
        res.status(200).send(store.remove(req.params.id, req.user));
    });

    router.use('/', (err, req, res, next) => {
        typeof err !== 'object' || err.from !== store ? next(err) : res.status(err.code).send(err.text);
    });

    return router;
}

module.exports = createRouter;
