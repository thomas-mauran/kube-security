// Import necessary modules
const express = require('express');
const cors = require('cors');  // Import the cors package
const fetch = require('node-fetch'); // Import node-fetch for making HTTP requests

const app = express();
const PORT = 3002;

app.use(cors());

// Route to get a random verb
app.get('/random', async (req, res) => {
  try {
    // Request to the verb microservice
    const verb = await fetch('http://verbs-service.app.svc.cluster.local/random');

    if (!verb.ok) {
      console.error('Failed to fetch random verb:', verb);
      // Handle non-200 HTTP responses
      return res.status(verb.status).json({ error: 'Failed to fetch random verb' });
    }

    const randomVerb = await verb.json(); // Assuming the response is in JSON format

    const noun = await fetch('http://nouns-service.app.svc.cluster.local/random');

    if (!noun.ok) {
      // Handle non-200 HTTP responses
      return res.status(noun.status).json({ error: 'Failed to fetch random noun' });
    }

    const randomNoun = await noun.json(); // Assuming the response is in JSON format

    return res.json({ verb: randomVerb, noun: randomNoun });

  } catch (error) {
    console.error('Error fetching random verb:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Gateway server is running on http://localhost:${PORT}`);
});
