const mongoose = require('mongoose');
const response = require('../utilities/response.js');


class UsersMongodb {
    constructor(connection) {
        this._ModelUserEntry = connection.model('UserEntry', UsersMongodb.SCHEMA_USER_ENTRY);
    }

    authenticate(userid, password) {
        return this._ModelUserEntry.findById(userid).exec().then((doc) => {
            if (!doc) {
                throw response(401, `User "${userid}" is not found among registered users.`);
            }
            if (password !== doc.password) {
                throw response(401, `Wrong password was submitted for "${userid}" user.`);
            }
            const { _id: id, fullname, email } = doc;
            return { id, fullname, email };
        });
    }
}

UsersMongodb.SCHEMA_USER_ENTRY = new mongoose.Schema({
    _id     : String,
    password: String,
    fullname: String,
    email   : String
});

module.exports = UsersMongodb;
