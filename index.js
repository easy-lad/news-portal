const express     = require('express');
const storeRouter = require('./news-store-router.js');
const mongoRouter = require('./news-mongodb-router.js');

const port   = 8888;
const server = express();


server.use('/api/news', express.json());  // Using a built-in middleware to parse JSON body.

server.use(['/api/news/mem', '/api/news/memory'], storeRouter());    // Two distinct memory-mapped news stores
server.use(['/api/news/mem2', '/api/news/memory2'], storeRouter());  // each mounted at two alternative routes.

server.use('/api/news/mongo', mongoRouter());   // Two distinct MongoDB news databases
server.use('/api/news/mongo2', mongoRouter());  // each mounted at its own route.

server.listen(port, () => console.log(`Server is listening on 0.0.0.0:${port}.`));
