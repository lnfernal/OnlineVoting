const crypto = require("crypto");

function makeHash(val) {
    return crypto.createHash('sha256').update(val).digest();
}

const hasher = {
    salt: function (password, salt) {
        let hash = crypto.createHash("sha256")
            .update(password)
            .update(makeHash(salt))
            .digest("base64");
        return hash
    },
    nosalt: function (password) {
        let hash = crypto.createHash("sha256")
            .update(password)
            .digest("base64");
        return hash
    }
}

module.exports = hasher