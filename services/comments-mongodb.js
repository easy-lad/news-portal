const mongoose = require('mongoose');
const response = require('../utilities/response.js');

const { ObjectId } = mongoose.Schema.Types;


class CommentsMongodb {
    constructor(connection) {
        this._ModelCommentEntry = connection.model('CommentEntry', CommentsMongodb.SCHEMA_COMMENT_ENTRY);
    }

    methods(promise) {
        return {
            get   : this._get.bind(this, promise),
            add   : this._add.bind(this, promise),
            update: this._update.bind(this, promise),
            remove: this._remove.bind(this, promise)
        };
    }

    _get(promise, id) {
        console.log(`STUB: CommentsMongodb#_get(id=${id}) ...`);
    }

    _add(promise, fields, user, idParent) {
        return promise.then((newsDoc) => {
            const comment = { idRoot: newsDoc._id, body: fields.body, addedBy: user.id };

            return !idParent ? this._addDoc(comment) : this._getDoc(idParent).then((parent) => {
                comment.ancestors = parent.ancestors;
                comment.ancestors.unshift(idParent);
                return this._addDoc(comment);
            });
        });
    }

    _update(promise, fields, user, id) {
        return promise.then(() => this._getDoc(id).then((doc) => {
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
            const query = { idRoot: newsDoc._id, deleteDate: null };

            return !id ? this._removeDocs(query, user) : this._getDoc(id).then((doc) => {
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

    _getDoc(id) {
        const query = { _id: id, deleteDate: null };

        return this._ModelCommentEntry.find(query).exec().then((docs) => {
            if (!docs.length) throw response(404, `No comment with _ID=${id} is found.`);
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
