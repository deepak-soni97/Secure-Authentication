const express = require('express');
const app = express();
const PORT = 3000;
const userRouter = require('./src/routers/userRouter')
const connectDB = require('./src/config/db');
app.use(express.json());
connectDB();

app.use('/api/auth',userRouter);
app.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`);
})