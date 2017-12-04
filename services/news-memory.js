const NewsStore = require('./news-store.js');


class NewsMemory extends NewsStore {
    constructor(settings) {
        super();
        this._store = [];

        if (settings && typeof settings === 'object') {
            const { entries } = settings;

            if (Array.isArray(entries)) {
                entries.forEach(entry => this.add(entry, { id: entry.who }));
            }
        }
    }

    get(query) {
        let output;

        if (!('id' in query)) {
            output = this._store.filter(entry => !('deleteDate' in entry));
        }
        else output = [this.getEntry(query.id)];

        if ('short' in query) {
            output = output.map((entry) => {
                const { sid, title, summary } = entry;
                return { sid, title, summary };
            });
        }
        return this.$resolved(200, { page: output, totalEntries: output.length });
    }

    add(fields, user) {
        const entry = {};
        const store = this._store;
        const toAdd = { title: null, summary: null, body: null, tags: [] };  // key:default

        entry.sid = store.length + 1;  // sid (stands for sequential identifier) starts at 1
        entry.addedBy = user.id;
        entry.addDate = (new Date()).toISOString();
        Object.keys(toAdd).forEach(k => entry[k] = k in fields ? fields[k] : toAdd[k] || `no ${k} given`);
        store.push(entry);
        return this.$resolved(201, `New entry with SID=${entry.sid} has been CREATED.`);
    }

    update(sid, fields, user) {
        const entry = this.$updateEntry(this.getEntry(sid), fields);
        entry.editedBy = user.id;
        entry.editDate = (new Date()).toISOString();
        return this.$resolved(200, `Entry with SID=${sid} has been UPDATED.`);
    }

    remove(sid, user) {
        const entry = this.getEntry(sid);
        entry.deletedBy = user.id;
        entry.deleteDate = (new Date()).toISOString();
        return this.$resolved(200, `Entry with SID=${sid} has been DELETED.`);
    }

    authenticate(userid, password) {
        console.log(`STUB: NewsMemory#authenticate(${userid},${password}) ...`);
        return Promise.resolve({ id: userid });
    }

    getEntry(sid) {
        const index = Number(sid) - 1;  // as the sid starts at 1 whereas arrays are zero-based
        const store = this._store;

        if (!(index in store) || 'deleteDate' in store[index]) {
            this.$throw(404, `No entry with SID=${sid} is found.`);
        }
        return store[index];
    }
}

module.exports = NewsMemory;
