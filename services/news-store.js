const utilResponse = require('../utilities/response.js');


class NewsStore {
    error(code, message) {
        throw utilResponse(code, message);
    }

    response(code, data) {
        return utilResponse(code, data);
    }
}

module.exports = NewsStore;
