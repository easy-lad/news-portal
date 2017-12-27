const mongoose = require('mongoose');
const response = require('../utilities/response.js');

const { ObjectId } = mongoose.Schema.Types;


class CommentsMongodb {
    constructor(connection) {
        this._ModelCommentEntry = connection.model('CommentEntry', CommentsMongodb.SCHEMA_COMMENT_ENTRY);
    }

    static linearToNested(row) {
        /*
         *  The array below will hold isolated sub-tries of comments. Each such a sub-tree is rooted
         *  at a distinct top-level comment directly posted on a given news entry. While all of them
         *  pertain to the same news entry, comments from the different sub-tries do not have common
         *  ancestor in the "ancestors" field as we intentionally keep there only _ids of comments,
         *  whereas _id of the news entry document that resides in a separate collection is stored
         *  in the dedicated field "idRoot". Thus, we separate the _ids as I do not know for sure if
         *  MongoDB guaranties the uniqueness of ObjectIDs across a collections.
         *  Another case is when we fetch a certain comment (not necessarily a top-level one) along
         *  with a sub-tree of comments rooted at it. Here, the array will hold only that sub-tree.
         */
        const clusters = [];
        const map = new Map();

        row.forEach((comment) => {  // The map populated here will be used below
            comment.comments = [];  // to quickly look up a comment by its _id serving as the key.
            map.set(String(comment._id), comment);
        });
        row.forEach((comment) => {                        // By using array methods forEach() and
            const parent = String(comment.ancestors[0]);  // push() we preserve the sorting order
            delete comment.ancestors;                     // of comments in the resulting hierarchy.
            (map.has(parent) ? map.get(parent).comments : clusters).push(comment);
        });
        return clusters;
    }

    methods(promise) {
        return {
            get   : this._get.bind(this, promise),
            add   : this._add.bind(this, promise),
            update: this._update.bind(this, promise),
            remove: this._remove.bind(this, promise)
        };
    }

    _get(promise, urlQuery, id) {
        return promise.then((newsDoc) => {
            const query = { idRoot: newsDoc._id, deleteDate: null };

            if (id) {
                if (!('single' in urlQuery)) {
                    query.$or = [{ _id: id }, { ancestors: id }];
                }
                else query._id = id;
            }
            const mQuery = this._ModelCommentEntry.find(query, '-idRoot -__v');
            const sort = `${'sortAsc' in urlQuery ? '' : '-'}addDate`;

            return mQuery.sort(sort).lean().exec().then(docs => response(200, docs));
        });
    }

    _add(promise, fields, user, id) {
        return promise.then((newsDoc) => {
            const idNews = newsDoc._id;
            const comment = { idRoot: idNews, body: fields.body, addedBy: user.id };

            return !id ? this._addDoc(comment) : this._getDoc(id, idNews).then((parent) => {
                comment.ancestors = parent.ancestors;
                comment.ancestors.unshift(parent._id);
                return this._addDoc(comment);
            });
        });
    }

    _update(promise, fields, user, id) {
        return promise.then(newsDoc => this._getDoc(id, newsDoc._id).then((doc) => {
            doc.editedBy = user.id;
            doc.editDate = Date.now();
            fields.body !== undefined && (doc.body = fields.body);

            return doc.save().then((sDoc) => {
                const message = `Comment with _ID=${sDoc._id} has been UPDATED.`;
                return response(200, message);
            });
        }));
    }

    _remove(promise, user, id) {
        return promise.then((newsDoc) => {
            const idNews = newsDoc._id;
            const query = { idRoot: idNews, deleteDate: null };

            return !id ? this._removeDocs(query, user) : this._getDoc(id, idNews).then((doc) => {
                query.$or = [{ _id: doc._id }, { ancestors: doc._id }];
                return this._removeDocs(query, user);
            });
        });
    }

    _addDoc(comment) {
        return this._ModelCommentEntry.create(comment).then((doc) => {
            const message = `New comment with _ID=${doc._id} has been CREATED.`;
            return response(201, message);
        });
    }

    _getDoc(idComment, idNews) {
        const query = { _id: idComment, idRoot: idNews, deleteDate: null };

        return this._ModelCommentEntry.find(query).exec().then((docs) => {
            if (!docs.length) {
                throw response(404, `News entry with _ID=${idNews} has no comment with _ID=${idComment}.`);
            }
            return docs[0];
        });
    }

    _removeDocs(query, user) {
        const update = { $set: { deletedBy: user.id }, $currentDate: { deleteDate: true } };

        return this._ModelCommentEntry.updateMany(query, update).exec().then((result) => {
            if (result.ok) {
                const n = result.nModified;
                return response(200, n ? `${n} comment(s) have been DELETED.` : 'No comments are found.');
            }
            throw new Error(`update operation has failed: n=${result.n}; nModified=${result.nModified}.`);
        });
    }
}

CommentsMongodb.SCHEMA_COMMENT_ENTRY = new mongoose.Schema({
    idRoot    : { type: ObjectId, required: true },  // ID of news document the comment belongs to.
    ancestors : { type: [ObjectId], default: [] },   // [0] holds ID of parent comment document.
    body      : { type: String, default: 'no comment given' },
    addDate   : { type: Date, default: Date.now },
    addedBy   : { type: String, required: true },
    editDate  : Date,
    editedBy  : String,
    deleteDate: Date,
    deletedBy : String
});

module.exports = CommentsMongodb;
