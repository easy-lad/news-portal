const express   = require('express');
const NewsStore = require('../services/news-store.js');


function createRouter() {
    const router = express.Router();
    const store = new NewsStore({ title: 'test entry', summary: 'automatically created for test purposes', who: 'server' });

    // Create
    router.post('/', (req, res) => {
        res.status(201).send(store.add(req.body));
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
        res.status(200).send(store.update(req.params.id, req.body));
    });

    // Delete
    router.delete('/:id', (req, res) => {
        res.status(200).send(store.remove(req.params.id));
    });

    router.use('/', (err, req, res, next) => {
        typeof err !== 'object' || err.from !== store ? next(err) : res.status(err.code).send(err.text);
    });

    return router;
}

module.exports = createRouter;
