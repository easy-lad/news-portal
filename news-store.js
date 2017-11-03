class NewsStore {
    constructor (...args) {
        this._store = [];
        args.forEach(a => this.add(a));
    }
    
    get (id, shortOutput) {
        const output = id !== 'all' ? [this.getEntry(id)] : this._store.filter(e => !('deleteDate' in e));
        
        return !shortOutput ? output : output.map(e => {
            const {_id, title, summary} = e;
            return {_id, title, summary};
        });
    }
    
    add (fields) {
        const entry = {};
        const store = this._store;
        const toAdd = {title:null, summary:null, body:null, tags:[]};  // key:default
        
        entry._id = store.length;
        entry.addDate = (new Date()).toISOString();
        entry.addedBy = 'who' in fields ? fields.who : 'anonymous';
        Object.keys(toAdd).forEach(k => entry[k] = k in fields ? fields[k] : toAdd[k] || `No "${k}" given.`);
        
        return `New entry with ID="${store.push(entry) - 1}" has been CREATED.`;
    }
    
    update (id, fields) {
        const entry = this.getEntry(id);
        const toUpdate = ['title', 'summary', 'body', 'tags'];
        
        toUpdate.forEach(k => k in fields && (entry[k] = fields[k]));
        entry.editDate = (new Date()).toISOString();
        entry.editedBy = 'who' in fields ? fields.who : 'anonymous';
        
        return `Entry with ID="${id}" has been UPDATED.`;
    }
    
    remove (id) {
        this.getEntry(id).deleteDate = (new Date()).toISOString();
        return `Entry with ID="${id}" has been DELETED.`;
    }
    
    getEntry (id) {
        const index = Number(id);
        const store = this._store;
        
        if (!(index in store) || 'deleteDate' in store[index]) {
            throw {from:this, code:404, text:`No entry with ID="${id}" is found.`};
        }
        
        return store[index];
    }
}

module.exports = NewsStore;
