const express        = require('express');
const expressSession = require('express-session');
const StoreMongo     = require('connect-mongo')(expressSession);
const { Passport }   = require('passport');
const StrategyLocal  = require('passport-local').Strategy;
const StrategyBasic  = require('passport-http').BasicStrategy;
const response       = require('../utilities/response.js');


function localSession(settings) {
    const options = {
        secret           : 'magic', // Session ID cookie will be signed with this secret.
        saveUninitialized: false,   // Do not save newly created sessions which are left intact.
        resave           : false,   // Do not save back restored sessions which are left intact.
        rolling          : true,    // Send the cookie with each response to defer its expiration.
        cookie           : {
            httpOnly: true,         // Prevent client-side JavaScript from accessing the cookie.
            maxAge  : 300000        // Set the cookie's "Expires" to (current time + maxAge(ms)).
        }
    };

    if (settings && typeof settings === 'object') {
        const { session } = settings;

        if (session && typeof session === 'object') {
            if (session.store === 'connect-mongo') {
                const { host = '127.0.0.1', port = 8888 } = session;
                const { dbName = 'test', collName: collection = 'sessions' } = session;
                const url = `mongodb://${host}:${port}/${dbName}`;
                options.store = new StoreMongo({ url, collection });
            }
            else if ('store' in session && session.store !== 'MemoryStore') {
                throw new Error(`Session store "${session.store}" is not supported.`);
            }
        }
    }
    return expressSession(options);
}

function local(resource, settings) {
    const passport = new Passport();
    passport.use(new StrategyLocal((username, password, done) => {
        resource.authenticate(username, password).then(user => done(null, user), err => done(err));
    }));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((idUser, done) => done(null, { id: idUser }));

    const routerSession = express.Router();
    routerSession.use(localSession(settings), passport.initialize(), passport.session());

    const routerPass = express.Router();
    routerPass.use(routerSession, (req, res, next) => {
        next(req.user ? 'route' : response(403, `Authentication is required to ${req.method} on "${req.originalUrl}".`));
    });

    const routerLogin = express.Router();
    routerLogin.use(routerSession, (req, res, next) => {
        if (!req.user) {
            passport.authenticate('local', (error, user) => {
                if (!error && user) {
                    req.login(user, err => (err ? next(err) : response(res, 200, `User "${user.id}" is logged in.`)));
                }
                else next(error || response(401, 'No expected credentials are received.'));
            })(req, res, next);
        }
        else response(res, 200, `User "${req.user.id}" is already logged in.`);
    });

    const routerLogout = express.Router();
    routerLogout.use(routerPass, (req, res, next) => {
        const user = req.user.id;
        req.logout();
        /*
         *  With the "connect-mongo" used as the session store, the above call to logout() does not
         *  yield the removal of the session document but merely sets its "session.passport" field
         *  to {}. Below, we forcibly delete the entire document through destroy().
         */
        req.session.destroy(err => (err ? next(err) : response(res, 200, `User "${user}" is logged out.`)));
    });

    return { pass: routerPass, login: routerLogin, logout: routerLogout };
}

function basic(resource) {
    const passport = new Passport();
    passport.use(new StrategyBasic((username, password, done) => {
        resource.authenticate(username, password).then(user => done(null, user), err => done(err));
    }));

    const router = express.Router();
    router.use(passport.initialize(), (req, res, next) => {
        passport.authenticate('basic', (error, user) => {
            if (error || !user) {
                res.set('WWW-Authenticate', `Basic realm="Access to ${req.baseUrl}/*"`);
                next(error || response(401, 'No expected credentials are received.'));
            }
            else {
                req.user = user;
                next();
            }
        })(req, res, next);
    });

    const nextRoute = (req, res, next) => next();
    return { pass: router, login: nextRoute, logout: nextRoute };
}

exports.local = local;
exports.basic = basic;
