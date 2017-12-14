const express    = require('express');
const tagsRouter = require('./tags-router.js');
const response   = require('../utilities/response.js');


function createRouter(NewsStore, authenticator, settings) {
    const router = express.Router();
    const store  = new NewsStore(settings.news);
    const auth   = authenticator(store.users, settings.auth);

    router.post('/login', auth.login);
    router.get('/logout', auth.logout);
    router.use('/tags', tagsRouter(store.tags, auth.pass), response.error404);

    // Create
    router.post('/', auth.pass, (req, res, next) => {
        response(store.add(req.body, req.user), res, next);
    });

    // Read
    router.get('/', auth.pass, (req, res, next) => {
        response(store.get(req.query), res, next);
    });

    // Read
    router.get('/:id', auth.pass, (req, res, next) => {
        req.query.id = req.params.id;
        response(store.get(req.query), res, next);
    });

    // Update
    router.put('/:id', auth.pass, (req, res, next) => {
        response(store.update(req.params.id, req.body, req.user), res, next);
    });

    // Delete
    router.delete('/:id', auth.pass, (req, res, next) => {
        response(store.remove(req.params.id, req.user), res, next);
    });

    return router;
}

module.exports = createRouter;
