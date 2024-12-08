// Import necessary modules
const express = require('express');
const cors = require('cors');  // Import the cors package
const app = express();


app.use(cors());

const PORT = 3001;

// Sample list of nouns
const nouns = [
  "dog",
  "cat",
  "house",
  "car",
  "tree",
  "book",
  "computer",
  "phone",
  "flower",
  "mountain",
  "river",
  "city",
  "ocean",
  "bird",
  "table"
];

// Middleware to handle JSON requests
app.use(express.json());

// Route to get a random noun
app.get('/random', (req, res) => {
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  res.json({ noun: randomNoun });
});

// Route to get all nouns
app.get('/all', (req, res) => {
  res.json({ nouns });
});

// Route to add a new noun
app.post('/add', (req, res) => {
  const { noun } = req.body;
  if (noun && !nouns.includes(noun)) {
    nouns.push(noun);
    res.status(201).json({ message: 'Noun added successfully', nouns });
  } else {
    res.status(400).json({ message: 'Invalid or duplicate noun' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Noun API is running at http://localhost:${PORT}`);
});
