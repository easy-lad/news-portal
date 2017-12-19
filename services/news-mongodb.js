const mongoose        = require('mongoose');
const NewsStore       = require('./news-store.js');
const TagsMongodb     = require('./tags-mongodb.js');
const UsersMongodb    = require('./users-mongodb.js');
const CommentsMongodb = require('./comments-mongodb.js');

/*
 *  Forcing Mongoose to use the native promise API; otherwise, it would use its default promise
 *  library "mpromise" that it declares deprecated as of this writing.
 */
mongoose.Promise = Promise;


class NewsMongodb extends NewsStore {
    constructor(settings) {
        super();

        const { host = '127.0.0.1', port = 8080, dbName = 'test' } = typeof settings === 'object' ? settings : {};
        const connectString = `mongodb://${host}:${port}/${dbName}`;
        const connect = mongoose.createConnection(connectString, { useMongoClient: true });

        this.tags = new TagsMongodb(connect);
        this.users = new UsersMongodb(connect);
        this._comments = new CommentsMongodb(connect);
        this._ModelNewsEntry = connect.model('NewsEntry', NewsMongodb.SCHEMA_NEWS_ENTRY);
        connect.then(() => console.log(`Connected to ${connectString}`), e => console.log(String(e)));
    }

    get(urlQuery) {
        const query = { deleteDate: null };
        const projection = 'short' in urlQuery ? '_id sid title summary' : '-__v';  // inclusive and exclusive projections
        const sorting = `${'sortAsc' in urlQuery ? '' : '-'}addDate`;

        'addedBy' in urlQuery && (query.addedBy = urlQuery.addedBy);
        'editedBy' in urlQuery && (query.editedBy = urlQuery.editedBy);

        this.addQueryId(urlQuery, query);
        this.addQueryTags(urlQuery, query);
        this.addQueryDate(urlQuery, 'addDate', query);
        this.addQueryDate(urlQuery, 'editDate', query);

        const size = Number(urlQuery.pageSize) || 10;
        const offset = Number(urlQuery.pageOffset) || 0;
        const mQuery = this._ModelNewsEntry.find(query, projection).skip(offset).limit(size);

        return mQuery.sort(sorting).lean().exec().then((docs) => {
            const handler = count => this.$promise(200, { page: docs, totalEntries: count });
            return this._ModelNewsEntry.count(query).exec().then(handler);
        });
    }

    add(fields, user) {
        return this._ModelNewsEntry.count({}).exec().then((count) => {
            const doc = this.$updateEntry({}, fields);
            doc.addedBy = user.id;
            doc.sid = count + 1;  // sid starts at 1

            return this._ModelNewsEntry.create(doc).then((cDoc) => {
                const message = `New entry with SID=${cDoc.sid} & _ID=${cDoc._id} has been CREATED.`;
                return this.$promise(201, message);
            });
        });
    }

    update(id, fields, user) {
        return this.getDoc(id).then((doc) => {
            this.$updateEntry(doc, fields);
            doc.editedBy = user.id;
            doc.editDate = Date.now();

            return doc.save().then((sDoc) => {
                const message = `Entry with SID=${sDoc.sid} & _ID=${sDoc._id} has been UPDATED.`;
                return this.$promise(200, message);
            });
        });
    }

    remove(id, user) {
        return this.getDoc(id).then((doc) => {
            doc.deletedBy = user.id;
            doc.deleteDate = Date.now();

            return doc.save().then((sDoc) => {
                const message = `Entry with SID=${sDoc.sid} & _ID=${sDoc._id} has been DELETED.`;
                return this.$promise(200, message);
            });
        });
    }

    commentsOn(id) {
        return this._comments.methods(this.getDoc(id));
    }

    addQueryId(input, query) {
        let key = null;
        const id = typeof input === 'object' ? input.id : input;

        if (typeof id === 'string') {
            key = id.length === 24 ? '_id' : 'sid';
            query[key] = id;
        }
        return key;
    }

    addQueryTags(urlQuery, outQuery) {
        let tags = urlQuery.tag;

        if (typeof tags === 'string' ? (tags = [tags]) : Array.isArray(tags)) {
            outQuery.tags = { ['anyTags' in urlQuery ? '$in' : '$all']: tags };
        }
    }

    addQueryDate(urlQuery, key, outQuery) {
        const clause = {};
        let gDate;
        let lDate;

        if ((gDate = urlQuery[`${key}Gte`])) {
            clause.$gte = this.parseDate(gDate);
        }
        else if ((gDate = urlQuery[`${key}Gt`])) {
            clause.$gt = this.parseDate(gDate);
        }
        if ((lDate = urlQuery[`${key}Lte`])) {
            clause.$lte = this.parseDate(lDate);
        }
        else if ((lDate = urlQuery[`${key}Lt`])) {
            clause.$lt = this.parseDate(lDate);
        }
        if (gDate || lDate) outQuery[key] = clause;
    }

    parseDate(string) {
        try {
            string = (new Date(string)).toISOString();
        }
        catch (error) {
            this.$throw(400, `Date string "${string}" could not be parsed due to ${error.name}:${error.message}.`);
        }
        return string;
    }

    getDoc(id) {
        const query = { deleteDate: null };
        const idKey = this.addQueryId(id, query);

        return this._ModelNewsEntry.find(query).exec().then((docs) => {
            if (!docs.length) this.$throw(404, `No news entry with ${idKey.toUpperCase()}=${id} is found.`);
            return docs[0];
        });
    }
}

NewsMongodb.SCHEMA_NEWS_ENTRY = new mongoose.Schema({
    sid       : { type: Number, required: true },  // sid stands for sequential identifier
    title     : { type: String, default: 'no title given' },
    summary   : { type: String, default: 'no summary given' },
    body      : { type: String, default: 'no body given' },
    tags      : { type: [String], default: [] },
    addDate   : { type: Date, default: Date.now },
    addedBy   : { type: String, required: true },
    editDate  : Date,
    editedBy  : String,
    deleteDate: Date,
    deletedBy : String
});

module.exports = NewsMongodb;
