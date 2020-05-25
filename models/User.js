const mongoose = require('mongoose');

//A scheme is used to structure data, here we make a structure based around the form that is going
//to be used in our front end files, so that we can save that data to our database.
const UserSchema = new mongoose.Schema({

    email: {
        type: String,
        unique: true
    },
    username: {
        type: String,
        unique: true
    },
   
    password: {
        type: String,
        unique: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    highScore: {
        type: Number,
        default: 0
      },

    date: {
        type: Date,
        default: Date.now
    }
});
//We use module.exports to 'expose' this module, so that we can call it in different files of pur project
module.exports = user = mongoose.model('user', UserSchema);