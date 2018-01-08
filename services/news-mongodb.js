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

        'addedBy' in urlQuery && (query.addedBy = urlQuery.addedBy);
        'editedBy' in urlQuery && (query.editedBy = urlQuery.editedBy);

        this._addQueryId(urlQuery, query);
        this._addQueryTags(urlQuery, query);
        this._addQueryDate(urlQuery, 'addDate', query);
        this._addQueryDate(urlQuery, 'editDate', query);

        const sort = { addDate: 'sortAsc' in urlQuery ? 1 : -1 };
        const size = Number(urlQuery.pageSize) || 10;
        const offset = Number(urlQuery.pageOffset) || 0;
        const project = 'short' in urlQuery ? { sid: 1, title: 1, summary: 1 } : { __v: 0 };
        const addComments = !('short' in urlQuery) && 'comments' in urlQuery;

        const pipeline = [
            { $match: query },                 // We use the $facet with 2 sub-pipelines in order to
            { $facet: {                        // obtain both the total number of entries matching
                total: [{ $count: 'count' }],  // the query criteria and a page of them through a
                news : [                       // single aggregation request to MongoDB server.
                    { $sort: sort },
                    { $limit: offset + size }, // Putting the $limit immediately after the $sort
                    { $skip: offset },         // allows to reduce RAM usage at the sorting stage.
                    { $project: project }
                ]
            } },
            /*  In order not to face the "BSON Document Size" limit, we return news entries
             *  as array of documents rather than embedded within a single document.
             *  Owing to preserveNullAndEmptyArrays:true, the $unwind always outputs at least one
             *  document even in the cases when either no entries match the query criteria or the
             *  specified offset is greater than or equal to the total number of matched entries.
             */
            { $unwind: { path: '$news', preserveNullAndEmptyArrays: true } }
        ];
        if (addComments) {
            pipeline.push(CommentsMongodb.lookupStage(urlQuery, 'news', 'comments'));
        }

        return this._ModelNewsEntry.aggregate(pipeline).exec().then((docs) => {
            const page = [];
            const totalEntries = docs[0].total.length && docs[0].total[0].count;

            if ('news' in docs[0]) {
                const linear = 'linear' in urlQuery;
                docs.forEach((doc) => {
                    if (addComments) {
                        const row = doc.comments;
                        doc.news.comments = linear ? row : CommentsMongodb.linearToNested(row);
                    }
                    page.push(doc.news);
                });
            }
            return this.$promise(200, { totalEntries, page });
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
        return this._getDoc(id).then((doc) => {
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
        return this._getDoc(id).then((doc) => {
            doc.deletedBy = user.id;
            doc.deleteDate = Date.now();

            return doc.save().then((sDoc) => {
                const message = `Entry with SID=${sDoc.sid} & _ID=${sDoc._id} has been DELETED.`;
                return this.$promise(200, message);
            });
        });
    }

    commentsOn(id) {
        return this._comments.methods(this._getDoc(id));
    }

    _addQueryId(input, query) {
        let key = null;
        let id = typeof input === 'object' ? input.id : input;

        if (typeof id === 'string') {
            if (id.length === 24) {
                key = '_id';
                id = mongoose.Types.ObjectId(id);
            }
            else {
                key = 'sid';
                id = Number(id);
            }
            query[key] = id;
        }
        return key;
    }

    _addQueryTags(urlQuery, outQuery) {
        let tags = urlQuery.tag;

        if (typeof tags === 'string' ? (tags = [tags]) : Array.isArray(tags)) {
            outQuery.tags = { ['anyTags' in urlQuery ? '$in' : '$all']: tags };
        }
    }

    _addQueryDate(urlQuery, key, outQuery) {
        const clause = {};
        let gDate;
        let lDate;

        if ((gDate = urlQuery[`${key}Gte`])) {
            clause.$gte = this._parseDate(gDate);
        }
        else if ((gDate = urlQuery[`${key}Gt`])) {
            clause.$gt = this._parseDate(gDate);
        }
        if ((lDate = urlQuery[`${key}Lte`])) {
            clause.$lte = this._parseDate(lDate);
        }
        else if ((lDate = urlQuery[`${key}Lt`])) {
            clause.$lt = this._parseDate(lDate);
        }
        if (gDate || lDate) outQuery[key] = clause;
    }

    _parseDate(string) {
        let date;
        try {
            date = new Date(string);
            date.toISOString();
        }
        catch (error) {
            this.$throw(400, `Date string "${string}" could not be parsed due to ${error.name}:${error.message}.`);
        }
        return date;
    }

    _getDoc(id) {
        const query = { deleteDate: null };
        const idKey = this._addQueryId(id, query);

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
