const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/user');
const dotenv = require('dotenv').config();
const authRouter = require('./routers/authRouter');
const blogRouter = require('./routers/blogRouter');
const userRouter = require('./routers/userRouter');
const cookieParser = require('cookie-parser');
const app = express();
const port = 9000;

app.use(express.json());
app.use(cookieParser());

app.use('/', authRouter);
app.use('/', userRouter);
app.use('/', blogRouter);

app.listen(port, async () => {
  try {
    const res = await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DBNAME,
    });
    console.log('Server Up and Running at port 9000');
  } catch (err) {
    console.error('Could Not Connect to DB: ' + err.message);
    return;
  }
});
