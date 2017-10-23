
const express    = require('express');
const bodyParser = require('body-parser');

const port   = 8888;
const server = express();
const store  = newsStore({title:'test entry', addedBy:'server', summary:'automatically created by server'});


server.get('/api/news', (req, res) => {
    
    try
    {
        res.status(200).json(store.get('all'));
    }
    catch (error)
    {
        res.status(500).send(error);
    }
});

server.get('/api/news/:id', (req, res) => {
    
    try
    {
        res.status(200).json(store.get(req.params.id));
    }
    catch (error)
    {
        res.status(404).send(error);
    }
});

server.post('/api/news', bodyParser.json(), (req, res) => {
    
    try
    {
        res.status(200).send(store.add(req.body))
    }
    catch (error)
    {
        res.status(500).send(error);
    }
});

server.listen(port, () => console.log(`The server is listening on port ${port}.`));



function newsStore(firstEntry)
{
    const store = [], output = {};
    
    output.get = function(id)
    {
        if (id === 'all') return store;
        
        const index = Number(id);
        
        if (index in store) return store[index];
        
        throw `No entry with ID="${id}" is found.`;
    }
    
    output.add = function(fields)
    {
        const entry = {};
        
        entry._id      = store.length;
        entry.addDate  = (new Date()).toISOString();
        entry.title    = 'title'   in fields ? fields.title   : 'no title given';
        entry.summary  = 'summary' in fields ? fields.summary : 'no summary given';
        entry.body     = 'body'    in fields ? fields.body    : 'no body given';
        entry.tags     = 'tags'    in fields ? fields.tags    : [];
        entry.addedBy  = 'addedBy' in fields ? fields.addedBy : 'anonymous';
        entry.editedBy = '';
        entry.editDate = '';
        
        return `New entry with ID="${store.push(entry) - 1}" has been created.`;
    }
    
    if (firstEntry) output.add(firstEntry);
    
    return output;
}
