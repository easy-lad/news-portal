const fs       = require('fs');
const path     = require('path');
const response = require('../utilities/response.js');


class UsersFile {
    constructor(pathName) {
        let readUsers;

        try {
            const extName = path.extname(pathName);
            const absPath = path.resolve(pathName);

            if (extName === '.json') {
                readUsers = UsersFile.readJson(absPath);
            }
            else if (extName === '.yaml') {
                readUsers = UsersFile.readYaml(absPath);
            }
            else throw new Error(`file "${path.basename(pathName)}" has unsupported extension`);
        }
        catch (error) {
            const message = `UsersFile(): ${error}`;
            console.error(message);
            readUsers = Promise.reject(message);
        }
        /*
         *  Below, we register a dummy handler solely to avoid the "[DEP0018] Unhandled promise
         *  rejections are deprecated" warning issued by Node.js when a rejected promise has no
         *  handler(s) registered on it. In effect, calling either then() or catch() (even with
         *  no arguments) on a rejected promise is treated by Node.js as handling the rejection.
         *  One more quirk here is that the handling must occur immediately after the rejection
         *  (perhaps, it is expected within the next turn of the event loop). If it occurs later
         *  on, extra warning "Promise rejection was handled asynchronously" will be issued.
         */
        readUsers.catch(() => {});
        this._readUsers = readUsers;
    }

    static readJson(filePath) {
        return new Promise((resolve, reject) => {
            try {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    try {
                        if (err) throw err;

                        const users = this._parseJson(data);
                        console.log(`UsersFile.readJson(${filePath}): ${users.size} user entries are read.`);
                        resolve(users);
                    }
                    catch (error) {
                        const message = `UsersFile.readJson(): ${error}`;
                        console.error(message);
                        reject(message);
                    }
                });
            }
            catch (error) {
                const message = `UsersFile.readJson(): ${error}`;
                console.error(message);
                reject(message);
            }
        });
    }

    static _parseJson(data) {
        const jsonData = JSON.parse(data);
        const fields = ['password', 'fullname', 'email'];
        const users = new Map();

        Object.keys(jsonData).forEach((userName) => {
            const jsonEntry = jsonData[userName];
            const userEntry = {};

            if (typeof jsonEntry !== 'object') {
                throw new Error(`entry for "${userName}" is not of the object type`);
            }
            fields.forEach((field) => {
                if (!(field in jsonEntry)) {
                    throw new Error(`entry for "${userName}" lacks mandatory field "${field}"`);
                }
                if (typeof jsonEntry[field] !== 'string') {
                    throw new Error(`entry for "${userName}" has field "${field}" not of the string type`);
                }
                userEntry[field] = jsonEntry[field];
            });
            users.set(userName, userEntry);
        });
        return users;
    }

    static readYaml() {
        throw new Error('reading YAML files is not supported yet');
    }

    authenticate(userid, password) {
        return this._readUsers.then((users) => {
            const user = users.get(userid);

            if (!user) {
                throw response(401, `User "${userid}" is not found among registered users.`);
            }
            if (password !== user.password) {
                throw response(401, `Wrong password was submitted for "${userid}" user.`);
            }
            return { id: userid, fullname: user.fullname, email: user.email };
        }, () => {
            throw response(500, 'Users file could not be read.');
        });
    }
}

module.exports = UsersFile;
