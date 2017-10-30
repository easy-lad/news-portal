const mongoose = require('mongoose');

const ObjectId  = mongoose.Types.ObjectId;
const TypeObjId = mongoose.Schema.Types.ObjectId;


class NewsMongodb {
    constructor () {
        
    }
}

NewsMongodb.NEWS_ENTRY_SCHEMA = new mongoose.Schema({
    _id     : {type: TypeObjId, 'default': new ObjectId      },
    title   : {type: String,    'default': 'no title given'  },
    summary : {type: String,    'default': 'no summary given'},
    body    : {type: String,    'default': 'no body given'   },
    tags    : {type: [String],  'default': []                }
});

module.exports = NewsMongodb;
