// Import necessary modules
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a connection to the SQLite database
const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Define the database schema without the removed fields
db.run(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    technician TEXT NOT NULL,
    partNumber TEXT NOT NULL,
    productLine TEXT NOT NULL,
    batchNumber TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    issue TEXT NOT NULL,
    issueComments TEXT NOT NULL,
    actionTaken TEXT NOT NULL,
    resolutionId TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS technicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS partNumbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS binNumbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    binNumber TEXT NOT NULL
  )
`);

// Updated the 'resolvedRecords' table schema to exclude the removed fields
db.run(`
  CREATE TABLE IF NOT EXISTS resolvedRecords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    technician TEXT NOT NULL,
    partNumber TEXT NOT NULL,
    productLine TEXT NOT NULL,
    batchNumber TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    issue TEXT NOT NULL,
    issueComments TEXT NOT NULL,
    actionTaken TEXT NOT NULL,
    resolutionId TEXT NOT NULL,
    problemType TEXT NOT NULL,
    binNumber TEXT NOT NULL,
    realIssue TEXT NOT NULL,
    physicalIssue TEXT,
    decision TEXT,
    resolvedComments TEXT,
    scrapReason TEXT
  )
`);

// Original function to insert a record into the 'records' table
const insertRecord = (record, callback) => {
  const { date, technician, partNumber, productLine, batchNumber, quantity, issue, issueComments, actionTaken, resolutionId } = record;
  const sql = 'INSERT INTO records (date, technician, partNumber, productLine, batchNumber, quantity, issue, issueComments, actionTaken, resolutionId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.run(sql, [date, technician, partNumber, productLine, batchNumber, quantity, issue, issueComments, actionTaken, resolutionId], callback);
};

// Original function to get all records from the 'records' table
const getAllRecords = (callback) => {
  const sql = 'SELECT * FROM records';
  db.all(sql, callback);
};

// Function to move a record to the 'resolvedRecords' table with the new fields
function moveRecordToResolved(recordId, newRecord, callback) {
  const {
    resolutionComment,
    problemType,
    binNumber,
    realIssue,
    physicalIssue,
    decision,
    resolvedComments, // Added field
    scrapReason // Added field
  } = newRecord;

  const selectSql = 'SELECT * FROM records WHERE id = ?';
  db.get(selectSql, [recordId], (err, row) => {
    if (err) {
      return callback(err);
    }

    const insertSql = `
      INSERT INTO resolvedRecords (date, technician, partNumber, productLine, batchNumber, quantity, issue, issueComments, actionTaken, resolutionId, problemType, binNumber, realIssue, physicalIssue, decision, resolvedComments, scrapReason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(
      insertSql,
      [
        row.date,
        row.technician,
        row.partNumber,
        row.productLine,
        row.batchNumber,
        row.quantity,
        row.issue,
        row.issueComments,
        row.actionTaken,
        row.resolutionId,
        problemType,
        binNumber,
        realIssue,
        physicalIssue,
        decision,
        resolvedComments,
        scrapReason
      ],
      (err) => {
        if (err) {
          return callback(err);
        }

        const deleteSql = 'DELETE FROM records WHERE id = ?';
        db.run(deleteSql, [recordId], (err) => {
          callback(err);
        });
      }
    );
  });
}

// Function to get all resolved records
function getAllResolvedRecords(callback) {
  const query = 'SELECT * FROM resolvedRecords';
  db.all(query, [], (err, rows) => {
    callback(err, rows);
  });
}

// Function to get a record by its ID
function getRecordById(recordId, callback) {
  const sql = 'SELECT * FROM records WHERE id = ?';
  db.get(sql, [recordId], (err, record) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, record);
    }
  });
}

// Function to get the resolution ID by record ID
const getResolutionIDByRecordID = (recordId, callback) => {
  const sql = 'SELECT resolutionId FROM records WHERE id = ?';

  db.get(sql, [recordId], (err, row) => {
    if (err) {
      callback(err, null);
    } else {
      if (row) {
        callback(null, row.resolutionId);
      } else {
        callback(null, null); // Record not found
      }
    }
  });
};

// Function to add a technician
const addTechnician = (technician, callback) => {
  const { name } = technician;
  const sql = 'INSERT INTO technicians (name) VALUES (?)';
  db.run(sql, [name], callback);
};

// Function to remove a technician
const removeTechnician = (technicianName, callback) => {
  const sql = 'DELETE FROM technicians WHERE name = ?';
  db.run(sql, [technicianName], callback);
};

// Function to get all technicians
const getAllTechnicians = (callback) => {
  const sql = 'SELECT * FROM technicians';
  db.all(sql, callback);
};

// Function to add a part number
const addPartNumber = (partNumber, callback) => {
  const sql = 'INSERT INTO partNumbers (number) VALUES (?)';
  db.run(sql, [partNumber], callback);
};

// Function to remove a part number
const removePartNumber = (partNumber, callback) => {
  const sql = 'DELETE FROM partNumbers WHERE number = ?';
  db.run(sql, [partNumber], callback);
};

// Function to get all part numbers
const getAllPartNumbers = (callback) => {
  const sql = 'SELECT * FROM partNumbers';
  db.all(sql, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      const partNumbers = rows.map(row => row.number);
      callback(null, partNumbers);
    }
  });
};

// Function to insert a new bin number
const addBinNumber = (binNumber, callback) => {
  const sql = 'INSERT INTO binNumbers (binNumber) VALUES (?)';
  db.run(sql, [binNumber], callback);
};

// Function to remove a bin number
const removeBinNumber = (binNumber, callback) => {
  const sql = 'DELETE FROM binNumbers WHERE binNumber = ?';
  db.run(sql, [binNumber], callback);
};

// Function to get all bin numbers
const getAllBinNumbers = (callback) => {
  const sql = 'SELECT * FROM binNumbers';
  db.all(sql, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      const binNumbers = rows.map((row) => row.binNumber);
      callback(null, binNumbers);
    }
  });
};

// Function to delete a record by its ID
function deleteRecord(recordId) {
  const sql = 'DELETE FROM records WHERE id = ?';
  db.run(sql, [recordId]);
  return true;
}

// Export all the functions
module.exports = {
  insertRecord,
  getAllRecords,
  getAllResolvedRecords,
  addTechnician,
  removeTechnician,
  getAllTechnicians,
  addPartNumber,
  removePartNumber,
  getAllPartNumbers,
  getRecordById,
  deleteRecord,
  moveRecordToResolved,
  addBinNumber,
  removeBinNumber,
  getAllBinNumbers,
  getResolutionIDByRecordID
};
