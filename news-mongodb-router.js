const express     = require('express');
const NewsMongodb = require('./news-mongodb.js');

module.exports = (settings) => {
    const router = express.Router();
    const db = new NewsMongodb(settings);
    
    /* Create */  router.post  ('/', (req, res) => res.status(201).send('POSTing to MongoDB is to be implemented.'));
    /* Read   */  router.get   ('/', (req, res) => res.status(200).send('GETing from MongoDB is to be implemented.'));
    /* Update */  router.put   ('/', (req, res) => res.status(200).send('PUTing to MongoDB is to be implemented.'));
    /* Delete */  router.delete('/', (req, res) => res.status(200).send('DELETing from MongoDB is to be implemented.'));
    
    return router;
}
