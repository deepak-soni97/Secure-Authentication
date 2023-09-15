require('dotenv').config();
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async() =>{
    try{
        await mongoose.connect(MONGODB_URI,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        });
        console.log('Connected to MongoDB successfully'); 
    }catch(error){
        console.log(error,'Error connecting to MongoDB');
    }
}

module.exports = connectDB;