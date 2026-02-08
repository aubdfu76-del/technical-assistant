const bcrypt = require('bcrypt');

const password = 'password123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function (err, hash) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Hash for '${password}': ${hash}`);
    console.log(`SQL Update: UPDATE users SET password_hash = '${hash}' WHERE employee_id = 'SUPER001';`);
});
