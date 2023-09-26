const express = require('express');
const app = express();
const plateRouter = require('./src/routers/plateRouter');
require('dotenv').config();

app.use(express.json());
app.use(plateRouter);

app.listen(8080);