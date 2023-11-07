const mongoose = require('mongoose');

const user = mongoose.Schema({
    login: String,
    password: String,
});

module.exports = mongoose.model('User', user);