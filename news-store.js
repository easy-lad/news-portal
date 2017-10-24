module.exports = class {
    constructor () {
        this._store = [];
        
        for (let i = 0, n = arguments.length; i < n; i++) {
            this.add(arguments[i]);
        }
    }
    
    get (id) {
        return id === 'all' ? this._store : this.getEntry(id);
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
    
    update (id, fields) {
        const entry = this.getEntry(id);
        const toUpdate = ['title', 'summary', 'body', 'tags'];
        
        toUpdate.forEach(f => f in fields && (entry[f] = fields[f]));
        entry.editDate = (new Date()).toISOString();
        entry.editedBy = 'editedBy' in fields ? fields.editedBy : 'anonymous';
        
        return `Entry with ID="${id}" has been updated/edited.`;
    }
    
    getEntry (id) {
        const index = Number(id);
        const store = this._store;
        
        if (index in store) return store[index];
        
        throw `No entry with ID="${id}" is found.`;
    }
}
