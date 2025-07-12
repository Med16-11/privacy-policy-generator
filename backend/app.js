const express = require('express');
const cors = require('cors');
const app = express();

const githubRoute = require('./routes/github');

app.use(cors()); // ✅ This enables cross-origin requests
app.use(express.json());

app.use('/github', githubRoute);

app.listen(4000, () => {
  console.log('🚀 Backend running on port 4000');
});
