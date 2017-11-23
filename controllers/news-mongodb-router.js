const express       = require('express');
const authenticator = require('./news-authenticator.js');
const NewsMongodb   = require('../services/news-mongodb.js');


function createRouter(settings) {
    const router = express.Router();
    const store = new NewsMongodb(settings);

    router.use('/', authenticator.local(store));

    // Create
    router.post('/', (req, res, next) => {
        res.locals.promise = store.add(req.body, req.user);
        next();
    });

    // Read
    router.get('/', (req, res, next) => {
        res.locals.promise = store.get(req.query);
        next();
    });

    // Read
    router.get('/:id', (req, res, next) => {
        req.query.id = req.params.id;
        res.locals.promise = store.get(req.query);
        next();
    });

    // Update
    router.put('/:id', (req, res, next) => {
        res.locals.promise = store.update(req.params.id, req.body, req.user);
        next();
    });

    // Delete
    router.delete('/:id', (req, res, next) => {
        res.locals.promise = store.remove(req.params.id, req.user);
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
