const express     = require('express');
const NewsMongodb = require('./news-mongodb.js');


function createRouter (settings) {
    const db = new NewsMongodb(settings);
    const router = express.Router();
    
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
    
    return router;
}

module.exports = createRouter;
