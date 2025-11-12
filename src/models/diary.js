const db = require('./database');

class DiaryModel {
  // Create a new diary entry
  static create(userId, title, content, images, callback) {
    const sql = `INSERT INTO diary_entries (user_id, title, content, images) VALUES (?, ?, ?, ?)`;
    db.run(sql, [userId, title, content, images], function(err) {
      callback(err, this.lastID);
    });
  }

  // Get all diary entries for a user
  static getAllByUser(userId, callback) {
    const sql = `SELECT * FROM diary_entries WHERE user_id = ? ORDER BY created_at DESC`;
    db.all(sql, [userId], callback);
  }

  // Get a single diary entry by id
  static getById(id, userId, callback) {
    const sql = `SELECT * FROM diary_entries WHERE id = ? AND user_id = ?`;
    db.get(sql, [id, userId], callback);
  }

  // Update a diary entry
  static update(id, userId, title, content, images, callback) {
    const sql = `UPDATE diary_entries SET title = ?, content = ?, images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
    db.run(sql, [title, content, images, id, userId], function(err) {
      callback(err, this.changes);
    });
  }

  // Delete a diary entry
  static delete(id, userId, callback) {
    const sql = `DELETE FROM diary_entries WHERE id = ? AND user_id = ?`;
    db.run(sql, [id, userId], function(err) {
      callback(err, this.changes);
    });
  }

  // Search diary entries
  static search(userId, query, callback) {
    const sql = `SELECT * FROM diary_entries WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) ORDER BY created_at DESC`;
    const searchTerm = `%${query}%`;
    db.all(sql, [userId, searchTerm, searchTerm], callback);
  }
}

module.exports = DiaryModel;
