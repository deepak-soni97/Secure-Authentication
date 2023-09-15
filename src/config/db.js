require('dotenv').config
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async() =>{
    try{
        await mongoose.connect("mongodb://localhost:27017/user_db",{
            useNewUrlParser:true,
            useUnifiedTopology:true
        });
        console.log('Connected to MongoDB successfully'); 
    }catch(error){
        console.log(error,'Error connecting to MongoDB');
    }
}

module.exports = connectDB;