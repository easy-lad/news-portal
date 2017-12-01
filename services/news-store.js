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
     *  In C++, such a methods would be declared with the "protected" access specifier.
     */
    $resolved(code, data) {
        return Promise.resolve(utilResponse(code, data));
    }

    $updateEntry(entry, input) {
        if (input && typeof input === 'object') {
            // First, we select only those fields which are allowed to be updated/edited.
            const { title, summary, body, tags } = input;
            input = { title, summary, body, tags };
            Object.keys(input).forEach(k => input[k] !== undefined && (entry[k] = input[k]));
        }
        return entry;
    }
}

module.exports = NewsStore;
