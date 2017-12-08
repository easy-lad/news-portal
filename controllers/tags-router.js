const express  = require('express');
const response = require('../utilities/response.js');


function createRouter(tags, auth) {
    const router = express.Router();
    const route = router.route('/:tag');

    // Create or update a tag.
    route.post(auth, (req, res, next) => {
        response(tags.add(req.params.tag, req.body.hint, req.user), res, next);
    });

    // Read all existing tags.
    router.get('/', auth, (req, res, next) => {
        response(tags.get(), res, next);
    });

    // Read a given tag.
    route.get(auth, (req, res, next) => {
        response(tags.get(req.params.tag), res, next);
    });

    // Delete a given tag.
    route.delete(auth, (req, res, next) => {
        response(tags.remove(req.params.tag), res, next);
    });

    return router;
}

module.exports = createRouter;
