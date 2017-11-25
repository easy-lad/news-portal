const express       = require('express');
const NewsMongodb   = require('./services/news-mongodb.js');
const storeRouter   = require('./controllers/news-store-router.js');
const mongoRouter   = require('./controllers/news-mongodb-router.js');
const authenticator = require('./controllers/authenticator.js');
const response      = require('./utilities/response.js');

const port   = 8888;
const server = express();

const mongoSettings  = { port: 8008, dbName: 'newsPortal' };
const mongoSettings2 = { port: 8008, dbName: 'newsPortal2' };


// Using built-in middlewares to parse requests body contents in JSON and URL-encoded formats.
server.use('/api/news', express.json());
server.use('/api/news', express.urlencoded({ extended: false }));

// Two distinct memory-mapped news stores each mounted at two alternative routes.
server.use(['/api/news/mem', '/api/news/memory'], storeRouter());
server.use(['/api/news/mem2', '/api/news/memory2'], storeRouter());

// Two distinct MongoDB-based news stores each mounted at its own route.
server.use('/api/news/mongo', mongoRouter(NewsMongodb, authenticator.local, mongoSettings));
server.use('/api/news/mongo2', mongoRouter(NewsMongodb, authenticator.local, mongoSettings2));

// Below, we handle any errors either generated by our own middlewares or raised elsewhere.
server.use(response.error);

server.listen(port, () => console.log(`Server is listening on 0.0.0.0:${port}.`));
