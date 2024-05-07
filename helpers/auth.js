const bcrypt = require("bcrypt");

const hashedPassword = (password) => {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      reject(err);
    }
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) {
        reject(err);
      }
      resolve(hash);
    });
  });
};

const comparePassword = (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = { hashedPassword, comparePassword };
