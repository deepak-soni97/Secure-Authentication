require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const userRouter = require('./src/routers/userRouter');
const authRouter = require('./src/routers/authRouter');
const connectDB = require('./src/config/db');
app.use(express.json());
connectDB();


app.get('/',(req,res)=>{
    res.status(200).send('welcome')
})
app.use('/api',userRouter);
app.use('/api/auth',authRouter)
app.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`);
})