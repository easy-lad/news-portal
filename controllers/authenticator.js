const express       = require('express');
const session       = require('express-session');
const { Passport }  = require('passport');
const StrategyLocal = require('passport-local').Strategy;
const StrategyBasic = require('passport-http').BasicStrategy;
const response      = require('../utilities/response.js');


function local(resource) {
    const expressSession = session({ secret: 'magic', saveUninitialized: false, resave: false });
    const passport = new Passport();

    passport.use(new StrategyLocal((username, password, done) => {
        resource.authenticate(username, password).then(user => done(null, user), err => done(err));
    }));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((idUser, done) => done(null, { id: idUser }));

    const routerSession = express.Router();
    routerSession.use(expressSession, passport.initialize(), passport.session());

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
    routerLogout.use(routerPass, (req, res) => {
        const user = req.user.id;
        req.logout();
        response(res, 200, `User "${user}" is logged out.`);
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
