const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;
const objectId = mongoose.Schema.Types.ObjectId;

/*
 *  Forcing Mongoose to use the native promise API;
 *  otherwise, it would use its default promise library "mpromise" that it declares deprecated as of this writing.
 */
mongoose.Promise = Promise;


class NewsMongodb {
    constructor (settings) {
        const c = mongoose.createConnection(`mongodb://localhost:8008/test`, {useMongoClient:true});
        this._ModelEntry = c.model('NewsEntry', NewsMongodb.NEWS_ENTRY_SCHEMA);
    }
    
    add (fields) {
        const doc = {};
        const toAdd = {title:null, summary:null, body:null, tags:null};  // {fieldsKey:docKey, ...}
        
        Object.keys(toAdd).forEach(k => k in fields && (doc[toAdd[k] || k] = fields[k]));
        
        return this._ModelEntry.create(doc).then(
            entry => `New entry with ID="${entry._id}" has been CREATED.`,
            error => {throw {code: 500, text: `${error.name}: ${error.message}`}}
        );
    }
}

NewsMongodb.NEWS_ENTRY_SCHEMA = new mongoose.Schema({
    _id     : {type: objectId, default: ObjectId          },
    title   : {type: String,   default: 'no title given'  },
    summary : {type: String,   default: 'no summary given'},
    body    : {type: String,   default: 'no body given'   },
    tags    : {type: [String], default: []                }
});

module.exports = NewsMongodb;
