class NewsMemory {
    constructor(...args) {
        this._store = [];
        args.forEach(a => this.add(a, { name: a.who }));
    }

    get(id, shortOutput) {
        const output = id !== 'all' ? [this.getEntry(id)] : this._store.filter(e => !('deleteDate' in e));

        return !shortOutput ? output : output.map((e) => {
            const { _id, title, summary } = e;
            return { _id, title, summary };
        });
    }

    add(fields, user) {
        const entry = {};
        const store = this._store;
        const toAdd = { title: null, summary: null, body: null, tags: [] };  // key:default

        entry._id = store.length;
        entry.addDate = (new Date()).toISOString();
        entry.addedBy = user.name;
        Object.keys(toAdd).forEach(k => entry[k] = k in fields ? fields[k] : toAdd[k] || `No "${k}" given.`);

        return `New entry with ID="${store.push(entry) - 1}" has been CREATED.`;
    }

    update(id, fields, user) {
        const entry = this.getEntry(id);
        const toUpdate = ['title', 'summary', 'body', 'tags'];

        toUpdate.forEach(k => k in fields && (entry[k] = fields[k]));
        entry.editDate = (new Date()).toISOString();
        entry.editedBy = user.name;

        return `Entry with ID="${id}" has been UPDATED.`;
    }

    remove(id) {
        this.getEntry(id).deleteDate = (new Date()).toISOString();
        return `Entry with ID="${id}" has been DELETED.`;
    }

    authenticate(username, password) {
        console.log(`STUB NewsMemory#authenticate(${username},${password}) : store.length=${this._store.length}`);
        if (username === 'admin') return Promise.resolve({ name: username });
        const error = { from: this, code: 401, text: `User "${username}" is not allowed to access the portal.` };
        return Promise.reject(error);
    }

    getEntry(id) {
        const index = Number(id);
        const store = this._store;

        if (!(index in store) || 'deleteDate' in store[index]) {
            const error = { from: this, code: 404, text: `No entry with ID="${id}" is found.` };
            throw error;
        }

        return store[index];
    }
}

module.exports = NewsMemory;
