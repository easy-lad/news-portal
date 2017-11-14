const mongoose = require('mongoose');

/*
 *  Forcing Mongoose to use the native promise API;
 *  otherwise, it would use its default promise library "mpromise" that it declares deprecated as of this writing.
 */
mongoose.Promise = Promise;


class NewsMongodb {
    constructor (settings) {
        const {host='127.0.0.1', port=8080, dbName='test'} = typeof settings === 'object' ? settings : {};
        const connectString = `mongodb://${host}:${port}/${dbName}`;
        const connect = mongoose.createConnection(connectString, {useMongoClient:true});
        
        this._ModelEntry = connect.model('NewsEntry', NewsMongodb.NEWS_ENTRY_SCHEMA);
        connect.then(() => console.log('Connected to ' + connectString), e => console.log(String(e)));
    }
    
    static isOwn (x) {
        return typeof x === 'object' && this.CLASS_ID in x;
    }
    
    get (urlQuery) {
        const query = {deleteDate:null};
        const projection = 'short' in urlQuery ? '_id sid title summary' : '-__v';  // inclusive and exclusive projections
        
        'addedBy' in urlQuery && (query.addedBy = urlQuery.addedBy);
        'editedBy' in urlQuery && (query.editedBy = urlQuery.editedBy);
        
        this.addQueryId(urlQuery, query);
        this.addQueryTags(urlQuery, query);
        this.addQueryDate(urlQuery, 'addDate', query);
        this.addQueryDate(urlQuery, 'editDate', query);
        
        const size = Number(urlQuery.pageSize) || 10;
        const offset = Number(urlQuery.pageOffset) || 0;
        const mQuery = this._ModelEntry.find(query, projection).skip(offset).limit(size).sort('-addDate');
        
        return mQuery.lean().exec().then(
            docs => this._ModelEntry.count(query).exec().then(
                count => this.response(200, {page:docs, totalEntries:count}),
                err => this.error(500, err)
            ),
            err => this.error(500, err)
        );
    }
    
    add (fields) {
        return this._ModelEntry.count({}).exec().then(
            count => {
                const doc = this.updateWith(fields, 'addedBy');
                doc.sid = count + 1;  // sid starts at 1
                
                return this._ModelEntry.create(doc).then(
                    doc => this.response(201, `New entry with SID=${doc.sid} & _ID=${doc._id} has been CREATED.`),
                    err => this.error(500, err)
                );
            },
            err => this.error(500, err)
        );
    }
    
    update (id, fields) {
        return this.getDoc(id).then(
            doc => {
                fields = this.updateWith(fields, 'editedBy');
                Object.keys(fields).forEach(k => fields[k] !== undefined && (doc[k] = fields[k]));
                doc.editDate = Date.now();
                
                return doc.save().then(
                    doc => this.response(200, `Entry with SID=${doc.sid} & _ID=${doc._id} has been UPDATED.`),
                    err => this.error(500, err)
                );
            }
        );
    }
    
    remove (id) {
        return this.getDoc(id).then(
            doc => {
                doc.deletedBy = 'anonymous';
                doc.deleteDate = Date.now();
                
                return doc.save().then(
                    doc => this.response(200, `Entry with SID=${doc.sid} & _ID=${doc._id} has been DELETED.`),
                    err => this.error(500, err)
                );
            }
        );
    }
    
    addQueryId (input, query) {
        if (typeof input === 'string' || (input = input.id)) {
            const key = input.length === 24 ? '_id' : 'sid';
            query[key] = input;
            return key;
        }
    }
    
    addQueryTags (urlQuery, outQuery) {
        let tags = urlQuery.tag;
        
        if (typeof tags === 'string' ? (tags = [tags]) : Array.isArray(tags)) {
            outQuery.tags = {['anyTags' in urlQuery ? '$in' : '$all']:tags};
        }
    }
    
    addQueryDate (urlQuery, key, outQuery) {
        let gDate, lDate, clause = {};
        
        if (gDate = urlQuery[key + 'Gte']) {
            clause.$gte = this.parseDate(gDate);
        }
        else if (gDate = urlQuery[key + 'Gt']) {
            clause.$gt = this.parseDate(gDate);
        }
        if (lDate = urlQuery[key + 'Lte']) {
            clause.$lte = this.parseDate(lDate);
        }
        else if (lDate = urlQuery[key + 'Lt']) {
            clause.$lt = this.parseDate(lDate);
        }
        if (gDate || lDate) outQuery[key] = clause;
    }
    
    parseDate (string) {
        try {
            return (new Date(string)).toISOString();
        }
        catch (error) {
            this.error(400, `Date string "${string}" could not be parsed due to ${error.name}:${error.message}.`);
        }
    }
    
    getDoc (id) {
        const query = {deleteDate:null}, idKey = this.addQueryId(id, query);
        
        return this._ModelEntry.find(query).exec().then(
            docs => {
                if (!docs.length) this.error(404, `No entry with ${idKey.toUpperCase()}=${id} is found.`);
                return docs[0];
            },
            err => this.error(500, err)
        );
    }
    
    updateWith (fields, keyWho) {
        const {title, summary, body, tags, who = 'anonymous'} = typeof fields === 'object' ? fields : {};
        return {title, summary, body, tags, [keyWho]:who};
    }
    
    error (code, error) {
        throw this.response(code, error instanceof Error ? `${error.name}: ${error.message}` : error);
    }
    
    response (code, data) {
        return {httpCode:code, output:data, [NewsMongodb.CLASS_ID]:this};
    }
}

NewsMongodb.CLASS_ID = Symbol('Unique ID of NewsMongodb class');

NewsMongodb.NEWS_ENTRY_SCHEMA = new mongoose.Schema({
    sid        : {type: Number,   required: true              },  // sid stands for sequential identifier
    title      : {type: String,   default:  'no title given'  },
    summary    : {type: String,   default:  'no summary given'},
    body       : {type: String,   default:  'no body given'   },
    tags       : {type: [String], default:  []                },
    addDate    : {type: Date,     default:  Date.now          },
    addedBy    : {type: String,   required: true              },
    editDate   : Date,
    editedBy   : String,
    deleteDate : Date,
    deletedBy  : String
});

module.exports = NewsMongodb;
