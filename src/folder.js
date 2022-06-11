import * as fs from "fs";
export class Folder {
    constructor() {
        this.user = '';
        this.userRoot = `./users/`;
    }
    get cwd() { return process.cwd(); }
    getuserFolder() { return `${this.userRoot}${this.user}`; }
    getcommitFileName() { return `${this.getuserFolder()}/.commits`; }
    getTransactionFileName(txid) { return `${this.getuserFolder()}/.thredz.tx.${txid}`; }
    createUser(user) {
        this.user = user;
        const userFolder = this.getuserFolder();
        if (fs.existsSync(userFolder)) {
            console.log(`user ${user} already exists at ${userFolder}`);
        }
        else {
            fs.mkdirSync(userFolder);
            console.log(`made ${userFolder}`);
        }
    }
    getfileContents(fileName) {
        const contents = fs.readFileSync(fileName);
        return contents;
    }
    // gets commits as json object
    getCommits() {
        const contents = this.getfileContents(this.getcommitFileName());
        if (contents[0] == 91) {
            const jcontents = JSON.parse(contents.toString());
            return jcontents;
        }
        else {
            return null;
        }
    }
    // this should be the only way of storing commits
    saveCommits(jcommits) {
        // store any commits broadcasted and filter those out
        // mark comes saved using .saved property
        jcommits.forEach((commit) => {
            this.storeTransaction(commit);
        });
        // save the rest
        const jnotsaved = jcommits.filter((c) => !c.saved);
        fs.writeFileSync(this.getcommitFileName(), JSON.stringify(jnotsaved));
    }
    //true if transaction was broadcast correctly
    isValidBroadcast(broadcast) {
        // taal just returns a txid
        return broadcast.length === 64;
        //and only hex numbers
    }
    // store the commit under the transactionid
    storeTransaction(commit) {
        if (commit.broadcast && this.isValidBroadcast(commit.broadcast)) {
            //TODO: validate broadcast txn and store in file
            // example broadcat: 123d27dc4a5024e87178e0d6e7dee476c114d928a627a27be5ce9840ccf18a72
            fs.writeFileSync(this.getTransactionFileName(commit.broadcast), JSON.stringify(commit));
            commit.saved = commit.broadcast;
        }
    }
    dumpFileContents(fileName, isCountOnly = false) {
        const contents = this.getfileContents(fileName);
        // console.log(`it`, contents[0])
        if (contents[0] == 91) {
            const jcontents = JSON.parse(contents.toString());
            if (!isCountOnly)
                console.log(jcontents);
            return jcontents.length;
        }
        else {
            console.log(contents.toString());
            return NaN;
        }
    }
    cancel() {
        if (this.isPendingCommit()) {
            fs.rmSync(this.getcommitFileName());
            console.log(`commit file has been deleted`);
        }
    }
    //stage a step of a unit of work
    stageWork(content) {
        let jcurrent = [];
        if (this.isPendingCommit()) {
            const current = this.getfileContents(this.getcommitFileName());
            jcurrent = JSON.parse(current.toString());
        }
        // commit file will be an array of json objects
        jcurrent.push({ hex: content.toString() });
        //fs.appendFileSync(this.getcommitFileName(), content.toString())
        this.saveCommits(jcurrent);
    }
    isPendingCommit() {
        const commits = this.getcommitFileName();
        return fs.existsSync(commits);
    }
    checkCommitsPending(isDetail = false) {
        const commits = this.getcommitFileName();
        if (fs.existsSync(commits)) {
            const count = this.dumpFileContents(commits, !isDetail);
            console.log(`Run 'thredz commit' to save ${count} changes to metanet`);
            if (!isDetail)
                console.log(`Run 'thredz status detail' see detailed changes`);
        }
        else {
            console.log(`No pending commits ${commits}`);
        }
    }
}
