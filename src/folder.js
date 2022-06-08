import * as fs from "fs";
export class Folder {
    constructor() {
        this.userRoot = `./users/`;
    }
    get cwd() { return process.cwd(); }
    getuserFolder(user) { return `${this.userRoot}${user}`; }
    createUser(user) {
        const userFolder = this.getuserFolder(user);
        if (fs.existsSync(userFolder)) {
            console.log(`user ${user} already exists at ${userFolder}`);
        }
        else {
            fs.mkdirSync(userFolder);
            console.log(`made ${userFolder}`);
        }
    }
    checkCommitsPending() {
        console.log(`TODO: check pending commits`);
    }
}
