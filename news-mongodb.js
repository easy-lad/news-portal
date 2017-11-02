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
        const {host='127.0.0.1', port=8080, dbName='test'} = typeof settings === 'object' ? settings : {};
        const connectString = `mongodb://${host}:${port}/${dbName}`;
        const connect = mongoose.createConnection(connectString, {useMongoClient:true});
        
        this._ModelEntry = connect.model('NewsEntry', NewsMongodb.NEWS_ENTRY_SCHEMA);
        connect.then(() => console.log('Connected to ' + connectString), e => console.log(String(e)));
    }
    
    add (fields) {
        const {title, summary, body, tags} = typeof fields === 'object' ? fields : {};
        const doc = {title, summary, body, tags};
        
        return this._ModelEntry.create(doc).then(
            entry => {return {httpCode: 201, output: `New entry with ID="${entry._id}" has been CREATED.`}},
            error => {return {httpCode: 500, output: `${error.name}: ${error.message}`}}
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
