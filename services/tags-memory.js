const response = require('../utilities/response.js');


class TagsMemory {
    constructor() {
        this._map = new Map();
    }

    get(tag) {
        if (!tag) {
            const output = [...this._map.values()].sort((t1, t2) => t1.tag.localeCompare(t2.tag));
            return response.promise(200, output);
        }
        if (!this._map.has(tag)) {
            return response.promise(404, `Tag "${tag}" is not found.`);
        }
        return response.promise(200, [this._map.get(tag)]);
    }

    add(tag, hint, user) {
        const value = { tag, addDate: (new Date()).toISOString(), addedBy: user.id };
        typeof hint === 'string' && (value.hint = hint);

        if (this._map.size === this._map.set(tag, value).size) {
            return response.promise(200, `Tag "${tag}" has been UPDATED.`);
        }
        return response.promise(201, `New tag "${tag}" has been CREATED.`);
    }

    remove(tag) {
        if (!this._map.delete(tag)) {
            return response.promise(404, `Tag "${tag}" is not found.`);
        }
        return response.promise(200, `Tag "${tag}" has been DELETED.`);
    }
}

module.exports = TagsMemory;
