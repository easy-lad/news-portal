const express  = require('express');
const response = require('../utilities/response.js');


function createRouter(NewsStore, authenticator, settings) {
    const router = express.Router();
    const store  = new NewsStore(settings);
    const auth   = authenticator(store);
    const reply  = (promise, res, next) => promise.then(v => response(res, v), r => next(r));

    router.post('/login', auth.login);
    router.get('/logout', auth.logout);

    // Create
    router.post('/', auth.pass, (req, res, next) => {
        reply(store.add(req.body, req.user), res, next);
    });

    // Read
    router.get('/', auth.pass, (req, res, next) => {
        reply(store.get(req.query), res, next);
    });

    // Read
    router.get('/:id', auth.pass, (req, res, next) => {
        req.query.id = req.params.id;
        reply(store.get(req.query), res, next);
    });

    // Update
    router.put('/:id', auth.pass, (req, res, next) => {
        reply(store.update(req.params.id, req.body, req.user), res, next);
    });

    // Delete
    router.delete('/:id', auth.pass, (req, res, next) => {
        reply(store.remove(req.params.id, req.user), res, next);
    });

    router.use('/', (err, req, res, next) => {
        NewsStore.isOwn(err) ? response(res, err) : next(err);
    });

    return router;
}

module.exports = createRouter;
