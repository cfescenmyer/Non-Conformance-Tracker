const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const database = require('./database');

const app = express();
const port = 3005;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve the add technician page
app.get('/addTechnician', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'addTechnician.html'));
});

// Serve the add part number page
app.get('/addPartNumber', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'addPartNumber.html'));
});

// Serve the add bin numbers page
app.get('/addBinNumbers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'addBinNumbers.html'));
});

// Endpoint to fetch bin numbers from the database
app.get('/binNumbers', (req, res) => {
    database.getAllBinNumbers((err, binNumbers) => {
        if (err) {
            console.error('Failed to fetch bin numbers from the database');
            res.sendStatus(500);
        } else {
            res.json(binNumbers);
        }
    });
});

// Handle adding a bin number
app.post('/addBinNumber', (req, res) => {
    const { binNumber } = req.body;
    if (!binNumber || typeof binNumber !== 'string') {
        res.status(400).json({ message: 'Invalid bin number' });
        return;
    }

    database.addBinNumber(binNumber, (err) => {
        if (err) {
            console.error(`Failed to add bin number '${binNumber}' to the database:`, err);
            res.status(500).json({ message: 'Failed to add bin number' });
        } else {
            console.log(`Bin number '${binNumber}' added to the database`);
            res.json({ message: 'Bin number added successfully' });
        }
    });
});

// Handle removing a bin number
app.post('/removeBinNumber', (req, res) => {
    const { binNumber } = req.body;
    if (!binNumber || typeof binNumber !== 'string') {
        res.status(400).json({ message: 'Invalid bin number' });
        return;
    }

    database.removeBinNumber(binNumber, (err) => {
        if (err) {
            console.error(`Failed to remove bin number '${binNumber}' from the database:`, err);
            res.status(500).json({ message: 'Failed to remove bin number' });
        } else {
            console.log(`Bin number '${binNumber}' removed from the database`);
            res.json({ message: 'Bin number removed successfully' });
        }
    });
});

// Handle removing a technician
app.post('/removeTechnician', (req, res) => {
    const { technicianName } = req.body;
    database.removeTechnician(technicianName, (err) => {
        if (err) {
            console.error(`Failed to remove technician '${technicianName}' from the database:`, err);
            res.sendStatus(500);
        } else {
            console.log(`Technician '${technicianName}' removed from the database`);
            res.sendStatus(200);
        }
    });
});

// Handle removing a part number
app.post('/removePartNumber', (req, res) => {
    const { partNumber } = req.body;
    database.removePartNumber(partNumber, (err) => {
        if (err) {
            console.error(`Failed to remove part number '${partNumber}' from the database:`, err);
            res.sendStatus(500);
        } else {
            console.log(`Part number '${partNumber}' removed from the database`);
            res.sendStatus(200);
        }
    });
});

// Handle moving records to resolved
app.post('/moveToResolved', (req, res) => {
    const { recordId, problemType, binNumber, realIssue, physicalIssue, decision, resolvedComments, scrapReason } = req.body;


    //If record ID is located within the resolved records table then return an error

    database.moveRecordToResolved(
        recordId,
        { problemType, binNumber, realIssue, physicalIssue, decision, resolvedComments, scrapReason },
        (err) => {
            if (err) {
                console.error(`Failed to move record '${recordId}' to resolved:`, err);
                res.status(500).send('Failed to move record to resolved');
            } else {
                console.log(`Record '${recordId}' moved to resolved`);
                res.sendStatus(200); 
            }
        }
    );
});

// Endpoint to fetch all part numbers
app.get('/partNumbers', (req, res) => {
    database.getAllPartNumbers((err, partNumbers) => {
        if (err) {
            console.error('Failed to fetch part numbers from the database');
            res.sendStatus(500);
        } else {
            res.json(partNumbers);
        }
    });
});

// Endpoint to fetch all technicians
app.get('/technicians', (req, res) => {
    database.getAllTechnicians((err, technicians) => {
        if (err) {
            console.error('Failed to fetch technicians from the database');
            res.sendStatus(500);
        } else {
            res.json(technicians);
        }
    });
});

// Fetch all records
app.get('/records', (req, res) => {
    database.getAllRecords((err, records) => {
        if (err) {
            console.error('Failed to fetch records from the database');
            res.sendStatus(500);
        } else {
            res.json(records);
        }
    });
});

// Fetch all resolved records
app.get('/resolvedRecords', (req, res) => {
    database.getAllResolvedRecords((err, resolvedRecords) => {
        if (err) {
            console.error('Failed to fetch resolved records from the database:', err);
            res.sendStatus(500);
        } else {
            res.json(resolvedRecords);
        }
    });
});

// Fetch a single record by ID
app.get('/getRecord/:id', (req, res) => {
    const recordId = req.params.id;

    database.getRecordById(recordId, (err, record) => {
        if (err) {
            console.error(`Failed to fetch record with ID ${recordId} from the database`);
            res.sendStatus(500);
        } else {
            if (record) {
                res.json(record);
            } else {
                res.status(404).send('Record not found');
            }
        }
    });
});

// Save a new record
app.post('/saveRecord', (req, res) => {
    const record = req.body;
    console.log('Received record:', record);

    if (!record.technician) {
        console.error('Failed to save record to the database: Technician is required');
        res.status(400).send('Technician is required');
        return;
    }

    database.insertRecord(record, (err) => {
        if (err) {
            console.error('Failed to save record to the database:', err);
            res.status(500).send('Failed to save record to the database');
        } else {
            console.log('Record saved to the database');
            res.sendStatus(200);
        }
    });
});

// Add a new technician
app.post('/addTechnician', (req, res) => {
    const { name } = req.body;
    database.addTechnician({ name }, (err) => {
        if (err) {
            console.error('Failed to add technician to the database:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

// Add a new part number
app.post('/addPartNumber', (req, res) => {
    const { partNumber } = req.body;
    database.addPartNumber(partNumber, (err) => {
        if (err) {
            console.error('Failed to add part number to the database:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

app.get('/getResolutionID', (req, res) => {
    const { recordId } = req.query;

    database.getResolutionIDByRecordID(recordId, (err, resolutionID) => {
        if (err) {
            console.error(`Failed to fetch Resolution ID for record with ID ${recordId}:`, err);
            res.sendStatus(500);
        } else {
            if (resolutionID !== null) {
                res.json({ resolutionID });
            } else {
                res.status(404).send('Resolution ID not found');
            }
        }
    });
});

// Process termination handler
process.on('SIGINT', () => {
    console.log('Server shutting down. Saving technicians and part numbers to the database...');
    database.saveTechniciansAndPartNumbersToDatabase(() => {
        console.log('Technicians and part numbers saved. Exiting.');
        process.exit();
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
