const utilResponse = require('../utilities/response.js');


class NewsStore {
    error(code, message) {
        throw utilResponse(code, message);
    }

    response(code, data) {
        return utilResponse(code, data);
    }
    /*
     *  Here, we adopt a naming convention where a methods intended for the use solely within a
     *  subclasses (not by the users of classes) are assigned a names beginning with "$" prefix.
     */
    $resolved(code, data) {
        return Promise.resolve(utilResponse(code, data));
    }
}

module.exports = NewsStore;
