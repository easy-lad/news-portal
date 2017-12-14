class UsersFile {
    constructor(pathName) {
        console.log(`STUB: UsersFile("${pathName}") ...`);
    }

    authenticate(userid, password) {
        console.log(`STUB: UsersFile#authenticate(${userid},${password}) ...`);
        return Promise.resolve({ id: userid });
    }
}

module.exports = UsersFile;
