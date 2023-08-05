const express = require('express');
const User = require('../models/user.js');
const multer = require('multer');
const sharp = require('sharp');
const auth = require('../middleware/auth.js');
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account.js');
const router = new express.Router();

router.post('/users', async (req, res) => {
  const user = User(req.body);

  try {
    await user.save();

    sendWelcomeEmail(user.email, user.name);

    const token = await user.generateAuthToken();

    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/users/login', async (req, res) => {
  try {
    // if (!req.body.email || !req.body.password) {
    //   res.status(400).send();
    // }

    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );

    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'password', 'email', 'age'];
  const isValidOpe = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOpe) {
    return res.status(400).send({ error: 'invalid update!' });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/users/me', auth, async (req, res) => {
  try {
    // sendCancelEmail(req.user.email, req.user.name);
    await req.user.remove();

    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

const upload = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/.(jpg|jpeg|png)$/)) {
      return cb(new Error('please provide an image.'));
    }
    cb(undefined, true);
  },
});

router.post('/users/me/avatar',
  auth,
  upload.single('avatar'),

  async (req, res) => {
    const bufferImg = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = bufferImg;
    await req.user.save();
    res.send();
  },

  (error, req, res, next) => {
    res.status(400).send({ error }); // u can use error.message
  }
);

router.delete('/users/me/avatar', auth, async (req, res) => {
  if (!req.user.avatar) {
    res.send({ message: 'you have no profile image' });
  }
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }
    // console.log(user.avatar);
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});
module.exports = router;
