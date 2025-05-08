const express = require('express');
const authRouter = express.Router();
const validateSignup = require('../validators/validateSignup');
const User = require('../models/user');
const bcrypt = require('bcrypt');

authRouter.post('/signup', async (req, res, next) => {
  const data = req.body;
  try {
    if (validateSignup(data)) {
      const { firstName, lastName, age, email, password } = data;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        firstName,
        lastName,
        email,
        age,
        password: hashedPassword,
      });
      await user.save();
      if (!user) {
        throw new Error('signup failed');
      }
      const JWT = await user.generateJWT();
      res.cookie('token', JWT, { maxAge: process.env.COOKIE_EXPIRY_MS });
      res.json({ user, message: 'Sign Up Successfull' });
    }
  } catch (err) {
    return res.status(400).send('ERROR: ' + err.message);
  }
  // next();
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // search for user in DB then get hash
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('No User with this email');
    }
    const hashedPassword = user.password;
    const passwordValid = await bcrypt.compare(password, hashedPassword);
    if (!passwordValid) {
      throw new Error('Invalid Credentials');
    }
    const JWT = await user.generateJWT();
    res.cookie('token', JWT, { maxAge: process.env.COOKIE_EXPIRY_MS });
    res.json({ user, message: 'Login Successfull' });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

authRouter.post('/logout', async (req, res) => {
  // how to logout ? just invalidate the cookies
  res.cookie('token', null, { expires: new Date(Date.now()) });
  res.send('Logged Out Successfully');
});

module.exports = authRouter;
