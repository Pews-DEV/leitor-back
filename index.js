const express = require('express');
const app = express();
const plateRouter = require('./src/routers/plateRouter');
require('dotenv').config();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  
app.use(express.json());
app.use(plateRouter);

app.listen(8080);