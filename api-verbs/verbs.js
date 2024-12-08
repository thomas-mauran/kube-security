// Import necessary modules
const express = require('express');
const cors = require('cors');  // Import the cors package
const app = express();
const PORT = 3000;

app.use(cors());

// Sample list of verbs
const verbs = [
  "run",
  "jump",
  "write",
  "sing",
  "read",
  "dance",
  "speak",
  "drive",
  "cook",
  "swim",
  "walk",
  "fly",
  "climb",
  "paint",
  "laugh"
];

// Middleware to handle JSON requests
app.use(express.json());

// Route to get a random verb
app.get('/random', (req, res) => {
  const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
  res.json({ verb: randomVerb });
});

// Route to get all verbs
app.get('/all', (req, res) => {
  res.json({ verbs });
});

// Route to add a new verb
app.post('/add', (req, res) => {
  const { verb } = req.body;
  if (verb && !verbs.includes(verb)) {
    verbs.push(verb);
    res.status(201).json({ message: 'Verb added successfully', verbs });
  } else {
    res.status(400).json({ message: 'Invalid or duplicate verb' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Verb API is running at http://localhost:${PORT}`);
});
