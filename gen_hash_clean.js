const bcrypt = require('bcrypt');
const password = 'password123';
bcrypt.hash(password, 10, function (err, hash) {
    if (err) return console.error(err);
    console.log(hash);
    console.log("Length: " + hash.length);
});
