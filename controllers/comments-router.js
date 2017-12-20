const express  = require('express');
const response = require('../utilities/response.js');


function createRouter(commentsOn, auth) {
    const router   = express.Router();
    const comments = router.route('/:idNews/comments');
    const comment  = router.route('/:idNews/comments/:idComment');

    // Fetch a comment tree rooted at a given news entry.
    comments.get(auth, (req, res, next) => {
        response(commentsOn(req.params.idNews).get(), res, next);
    });

    // Add new comment rooted at a given news entry.
    comments.post(auth, (req, res, next) => {
        response(commentsOn(req.params.idNews).add(req.body, req.user), res, next);
    });

    // Delete a comment tree rooted at a given news entry.
    comments.delete(auth, (req, res, next) => {
        response(commentsOn(req.params.idNews).remove(req.user), res, next);
    });

    // Fetch a given comment along with a sub-tree of comments rooted at it.
    comment.get(auth, (req, res, next) => {
        response(commentsOn(req.params.idNews).get(req.params.idComment), res, next);
    });

    // Add new comment rooted at a given comment.
    comment.post(auth, (req, res, next) => {
        const { add } = commentsOn(req.params.idNews);
        response(add(req.body, req.user, req.params.idComment), res, next);
    });

    // Update a given comment.
    comment.put(auth, (req, res, next) => {
        const { update } = commentsOn(req.params.idNews);
        response(update(req.body, req.user, req.params.idComment), res, next);
    });

    // Delete a given comment along with a sub-tree of comments rooted at it.
    comment.delete(auth, (req, res, next) => {
        const { remove } = commentsOn(req.params.idNews);
        response(remove(req.user, req.params.idComment), res, next);
    });

    return router;
}

module.exports = createRouter;
