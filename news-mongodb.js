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
            entry => {return {httpCode: 201, output: `New entry with ID="${entry._id}" has been CREATED.`}},
            error => {return {httpCode: 500, output: `${error.name}: ${error.message}`}}
        );
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
