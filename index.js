const express  = require('express');
const nsRouter = require('./news-store-router.js');

const port   = 8888;
const server = express();


server.use('/api/news', express.json());  // Using a built-in middleware to parse JSON body.

server.use(['/api/news/mem', '/api/news/memory'], nsRouter());    // Two distinct memory-mapped news stores
server.use(['/api/news/mem2', '/api/news/memory2'], nsRouter());  // each mounted at two alternative routes.

server.listen(port, () => console.log(`Server is listening on 0.0.0.0:${port}.`));
