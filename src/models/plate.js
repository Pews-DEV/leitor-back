const mongoose = require('mongoose');

const plate = mongoose.Schema({
    city: String,
    plate_number: String,
    date: String,
});

module.exports = mongoose.model('Plate', plate);