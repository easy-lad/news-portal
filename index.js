const express    = require('express');
const bodyParser = require('body-parser');
const NewsStore  = require('./news-store.js');

const port   = 8888;
const server = express();
const store  = new NewsStore({title:'test entry', addedBy:'server', summary:'automatically created for test purposes'});


server.use('/api/news', bodyParser.json());

server.get('/api/news', (req, res) => {
    try {
        res.status(200).json(store.get('all'));
    }
    catch (error) {
        res.status(500).send(error);
    }
});

server.get('/api/news/:id', (req, res) => {
    try {
        res.status(200).json(store.get(req.params.id));
    }
    catch (error) {
        res.status(404).send(error);
    }
});

server.put('/api/news/:id', (req, res) => {
    try {
        res.status(200).send(store.update(req.params.id, req.body));
    }
    catch (error) {
        res.status(404).send(error);
    }
});

server.post('/api/news', (req, res) => {
    try {
        res.status(200).send(store.add(req.body))
    }
    catch (error) {
        res.status(500).send(error);
    }
});

server.listen(port, () => console.log(`The server is listening on port ${port}.`));
