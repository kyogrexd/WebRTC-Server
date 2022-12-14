// caller: User, callee: User
class roomUser {
    constructor(users) {
        this.users = users
    }
}

class User {
    constructor(userName, socketID) {
        this.userName = userName
        this.socketID = socketID
    }
}

module.exports = {
    roomUser,
    User
  };