const db = require('./database');
const bcrypt = require('bcryptjs');

class UserModel {
  // Find user by username
  static findByUsername(username, callback) {
    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], callback);
  }

  // Verify password
  static verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  // Create new user
  static create(username, password, callback) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(sql, [username, hashedPassword], function(err) {
      callback(err, this.lastID);
    });
  }
}

module.exports = UserModel;
