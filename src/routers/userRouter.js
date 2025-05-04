const express = require('express');
const userRouter = express.Router();
const User = require('../models/user');
const { userAuth } = require('../middlewares/auth');

userRouter.get('/api/user', userAuth, async (req, res) => {
  if (!req.user.id) {
    return res.send('Not Logged In');
  }
  const targetId = req.user.id;
  const user = await User.findById(targetId);
  res.json({ message: 'User Details Found', user });
});

module.exports = userRouter;
