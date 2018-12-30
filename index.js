const sqlite3 = require('sqlite3').verbose();

let db = null;

let settings = {
  sqlitePath: './visits.sqlite'
}

let VisitLogger = (req, res, next) => {

  db.serialize(function () {
    db.run(`INSERT INTO visits VALUES (datetime('now'), "${req.path}");`);
  });

  next();
};

let VisitLoader = {
  clearLog: () => {
    db.run("DELETE FROM visits;");
  },
  getLog: (path) => {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM visits ${typeof path !== "undefined" ? "WHERE path = '" + path + "'" : ""};`;
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject({ 'error': err });
        } else {
          if (typeof path === "undefined") {
            resolve(rows);
          } else {
            resolve(rows.map(o => o.timestamp));
          }
        }
      });
    });
  },
  getCount: (path) => {
    return new Promise((resolve, reject) => {
      let sql = `SELECT COUNT(*) AS n FROM visits ${typeof path !== "undefined" ? "WHERE path = '" + path + "'" : ""};`;
      db.get(sql, (err, row) => {
        if (err) {
          reject({ 'error': err });
        } else {
          resolve(row.n);
        }
      });
    });
  }
}

let initialize = (options) => {
  if (typeof options !== "undefined" && typeof options.sqlitePath !== "undefined") {
    settings.sqlitePath = options.sqlitePath;
  }

  db = new sqlite3.Database(settings.sqlitePath, (err) => {
    if (err) {
      return console.error(err.message);
    }
  });

  db.serialize(function () {
    db.run(`CREATE TABLE IF NOT EXISTS visits (timestamp datetime, path TEXT);`);
  });

  return VisitLogger;
}

module.exports = VisitLogger;
module.exports.Logger = VisitLogger;
module.exports.Loader = VisitLoader;
module.exports.initialize = initialize;