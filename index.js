const express   = require('express');
const NewsStore = require('./news-store.js');

const port   = 8888;
const server = express();
const store  = new NewsStore({title:'test entry', summary:'automatically created for test purposes', who:'server'});


server.use('/api/news', express.json());  // Using a built-in middleware to parse JSON body.

server.get('/api/news', (req, res) => res.status(200).json(store.get('all', 'short' in req.query)));

server.get('/api/news/:id', (req, res) => res.status(200).json(store.get(req.params.id, 'short' in req.query)));

server.put('/api/news/:id', (req, res) => res.status(200).send(store.update(req.params.id, req.body)));

server.post('/api/news', (req, res) => res.status(200).send(store.add(req.body)));

server.delete('/api/news/:id', (req, res) => res.status(200).send(store.remove(req.params.id)));

server.use((e, req, res, next) => typeof e !== 'object' || e.from !== store ? next(e) : res.status(e.code).send(e.text));

server.listen(port, () => console.log(`The server is listening on port ${port}.`));
