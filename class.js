// caller: User, callee: User
class roomUser {
    constructor(users) {
        this.users = users
    }
}

class User {
    constructor(userName, socketID, refreshTime) {
        this.userName = userName
        this.socketID = socketID
        this.refreshTime = refreshTime
    }
}

module.exports = {
    roomUser,
    User
  };