module.exports = class {
    constructor () {
        this._store = [];
        
        for (let i = 0, n = arguments.length; i < n; i++) {
            this.add(arguments[i]);
        }
    }
    
    get (id) {
        const index = Number(id);
        const store = this._store;
        
        if (id === 'all') return store;
        
        if (index in store) return store[index];
        
        throw `No entry with ID="${id}" is found.`;
    }
    
    add (fields) {
        const entry = {};
        const store = this._store;
        
        entry._id      = store.length;
        entry.addDate  = (new Date()).toISOString();
        entry.addedBy  = 'addedBy' in fields ? fields.addedBy : 'anonymous';
        entry.title    = 'title'   in fields ? fields.title   : 'no title given';
        entry.summary  = 'summary' in fields ? fields.summary : 'no summary given';
        entry.body     = 'body'    in fields ? fields.body    : 'no body given';
        entry.tags     = 'tags'    in fields ? fields.tags    : [];
        entry.editedBy = '';
        entry.editDate = '';
        
        return `New entry with ID="${store.push(entry) - 1}" has been created.`;
    }
}
