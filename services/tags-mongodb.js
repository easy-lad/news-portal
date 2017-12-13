const mongoose = require('mongoose');
const response = require('../utilities/response.js');


class TagsMongodb {
    constructor(connection) {
        this._ModelTagEntry = connection.model('TagEntry', TagsMongodb.SCHEMA_TAG_ENTRY);
    }

    get(tag) {
        const query = this._ModelTagEntry.find(tag ? { _id: tag } : {}, '-__v');

        return query.sort('_id').lean().exec().then((docs) => {
            if (tag && !docs.length) {
                throw response(404, `Tag "${tag}" is not found.`);
            }
            docs.forEach((doc) => {
                doc.tag = doc._id;
                delete doc._id;
            });
            return response(200, docs);
        });
    }

    add(tag, hint, user) {
        const update = { addDate: Date.now(), addedBy: user.id };
        typeof hint === 'string' && (update.hint = hint);
        const query = this._ModelTagEntry.findByIdAndUpdate(tag, update, { upsert: true });

        return query.exec().then((doc) => {
            if (doc) {
                return response(200, `Tag "${tag}" has been UPDATED.`);
            }
            return response(201, `New tag "${tag}" has been CREATED.`);
        });
    }

    remove(tag) {
        return this._ModelTagEntry.findByIdAndRemove(tag).exec().then((doc) => {
            if (!doc) {
                throw response(404, `Tag "${tag}" is not found.`);
            }
            return response(200, `Tag "${tag}" has been DELETED.`);
        });
    }
}

TagsMongodb.SCHEMA_TAG_ENTRY = new mongoose.Schema({
    _id    : { type: String, required: true },  // Tag itself is stored in the "_id" field and
    addDate: { type: Date, default: Date.now }, // therefore must be unique within the collection.
    addedBy: { type: String, required: true },
    hint   : String
});

module.exports = TagsMongodb;
