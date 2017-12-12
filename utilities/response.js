const ID = Symbol('Unique ID for objects returned by response()');

function output(code, data) {
    const date = (new Date()).toISOString();
    return { httpCode: code, output: data, sentOn: date, [ID]: ID };
}
/*
 *  The function can be invoked in the following ways:
 *  1) response(code, data)         - creates output object and returns it
 *  2) response(res, output)        - finishes the request-response cycle replying with the output
 *  3) response(res, code, data)    - like the above but replies with output composed of the last
 *                                    two parameters
 *  4) response(promise, res, next) - sets the both promise handlers which will complete the cycle
 *
 *  code    - HTTP status code to be put into output object.
 *  data    - Primitive/object value (e.g., message or array of objects) to be put into the output.
 *  res     - Express response object.
 *  next    - Express next() function.
 *  output  - Output object created by this function before (see the case #1).
 *  promise - Instance of Promise whose settlement we have to wait for.
 */
function response(...p) {
    if (p[0] instanceof Promise) {
        return p[0].then(value => response(p[1], value), reason => p[2](reason));
    }
    if (typeof p[0] === 'object') {
        const out = typeof p[1] === 'object' ? p[1] : output(p[1], p[2]);
        return p[0].status(out.httpCode).json(out);
    }
    return output(p[0], p[1]);
}

response.promise = (code, data) => {
    const o = output(code, data);
    return code >= 200 && code < 300 ? Promise.resolve(o) : Promise.reject(o);
};

response.error = (err, req, res, next) => {
    if (typeof err !== 'object' || !(ID in err)) {
        response(res, 500, err instanceof Error ? `${err.name}: ${err.message}` : err);
    }
    else response(res, err);
    /*
     *  Since the function is designed to serve as the error-handling middleware, it must have 4
     *  declared parameters. Two of them (req, next), however, are not needed here. So, the only
     *  purpose of the following is to prevent a linter from complaining about unused variables.
     */
    return { req, next };
};

response.error404 = (req, res, next) => {
    const eitherUrl = `Either resource "${req.originalUrl}" does not exist`;
    next(response(404, `${eitherUrl} or method "${req.method}" is not applicable to it.`));
};

module.exports = response;
