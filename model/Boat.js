const mongoose = require('mongoose');

const boatSchema = new mongoose.Schema({
    name: String,
    tracking: [{
    	lat: Number,
    	lng: Number,
    	speed: String,
    	fuel: String,
    	dateCreate: Date,
    	bearing: String
    }]
}, {timestamps: true, usePushEach: true});

const Boat = mongoose.model('Boat', boatSchema);

module.exports = Boat;
