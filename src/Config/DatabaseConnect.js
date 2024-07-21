const mongoose = require('mongoose');
const dotenv = require('dotenv');

const dbConnect = async()=>{
    await mongoose.connect(`${process.env.MONGO_URL}`)
    .then(()=> console.log("Database connection successfully"));
}

module.exports  = dbConnect;
