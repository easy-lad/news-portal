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
    
    add (fields) {
        const {title, summary, body, tags, who:addedBy = 'anonymous'} = typeof fields === 'object' ? fields : {};
        const doc = {title, summary, body, tags, addedBy};
        
        return this._ModelEntry.create(doc).then(
            doc => this.response(201, `New entry with ID="${doc._id}" has been CREATED.`),
            err => this.error500(err)
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
        return this._ModelEntry.find({_id:id}).exec().then(
            docs => {
                if (!docs.length) throw this.response(404, `No entry with ID="${id}" is found.`);
                
                return docs[0];
            },
            err => {throw this.error500(err)}
        );
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
