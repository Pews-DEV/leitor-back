require('dotenv').config();
const express = require('express');
const cors = require('cors');
const plateRouter = require('./routers/plateRouter');

const app = express();
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    app.use(cors());
    next();
  });

app.use(express.json());
app.use(plateRouter);

app.listen(8080, () => {
  console.log('Server running in 8080')
});