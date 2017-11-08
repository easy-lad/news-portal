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
    
    get (query) {
        const objQuery = {deleteDate:null};
        const projection = 'short' in query ? '_id title summary' : '-__v';  // inclusive and exclusive projections
        const result = {};
        
        'addedBy' in query && (objQuery.addedBy = query.addedBy);
        'editedBy' in query && (objQuery.editedBy = query.editedBy);
        
        return this._ModelEntry.find(objQuery, projection).lean().exec().then(
            docs => {
                result.page = docs;
                result.totalEntries = docs.length;
                return this.response(200, result);
            },
            err => this.error500(err)
        );
    }
    
    add (fields) {
        return this._ModelEntry.create(this.updateWith(fields, 'addedBy')).then(
            doc => this.response(201, `New entry with ID="${doc._id}" has been CREATED.`),
            err => this.error500(err)
        );
    }
    
    update (id, fields) {
        return this.getDoc(id).then(
            doc => {
                fields = this.updateWith(fields, 'editedBy');
                Object.keys(fields).forEach(k => fields[k] !== undefined && (doc[k] = fields[k]));
                doc.editDate = Date.now();
                
                return doc.save().then(
                    doc => this.response(200, `Entry with ID="${doc._id}" has been UPDATED.`),
                    err => this.error500(err)
                );
            },
            err => err
        );
    }
    
    remove (id) {
        return this.getDoc(id).then(
            doc => {
                doc.deletedBy = 'anonymous';
                doc.deleteDate = Date.now();
                
                return doc.save().then(
                    doc => this.response(200, `Entry with ID="${doc._id}" has been DELETED.`),
                    err => this.error500(err)
                );
            },
            err => err
        );
    }
    
    getDoc (id) {
        return this._ModelEntry.find({_id:id, deleteDate:null}).exec().then(
            docs => {
                if (!docs.length) throw this.response(404, `No entry with ID="${id}" is found.`);
                return docs[0];
            },
            err => {throw this.error500(err)}
        );
    }
    
    updateWith (fields, keyWho) {
        const {title, summary, body, tags, who = 'anonymous'} = typeof fields === 'object' ? fields : {};
        return {title, summary, body, tags, [keyWho]:who};
    }
    
    error500 (e) {
        return this.response(500, `${e.name}: ${e.message}`);
    }
    
    response (code, data) {
        return {httpCode:code, output:data};
    }
}

NewsMongodb.NEWS_ENTRY_SCHEMA = new mongoose.Schema({
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
