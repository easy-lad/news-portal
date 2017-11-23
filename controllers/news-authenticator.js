const express       = require('express');
const session       = require('express-session');
const { Passport }  = require('passport');
const StrategyLocal = require('passport-local').Strategy;


function routerLocal(newsStore) {
    const router = express.Router();
    const passport = new Passport();

    passport.use(new StrategyLocal((username, password, done) => {
        newsStore.authenticate(username, password).then(usr => done(null, usr), err => done(err));
    }));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((idUser, done) => done(null, { id: idUser }));

    router.use('/', session({ secret: 'magic', saveUninitialized: false, resave: false }));
    router.use('/', passport.initialize());
    router.use('/', passport.session());

    router.post('/login', (req, res, next) => {
        if (!req.user) {
            passport.authenticate('local', (error, user) => {
                if (!error && user) {
                    req.login(user, (err) => {
                        if (!err) {
                            res.status(200).json(newsStore.response(200, `User "${user.id}" is logged in.`));
                        }
                        else next(err);
                    });
                }
                else next(error || newsStore.response(401, 'No expected credentials are received.'));
            })(req, res, next);
        }
        else res.status(200).json(newsStore.response(200, `User "${req.user.id}" is already logged in.`));
    });

    router.use('/', (req, res, next) => {
        next(req.user ? 'route' : newsStore.response(401, 'Authentication was not fulfilled so far.'));
    });

    return router;
}

exports.local = routerLocal;
