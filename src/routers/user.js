const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth')
const router = new express.Router();

router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({
      user,
      token
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({
      user,
      token
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

// after login
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    })
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

router.patch('/user/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdate = ['name',
    'email',
    'password',
    'age'
  ];
  const isValidOperation = updates.every((update) => {
    return allowUpdate.includes(update);
  });
  if (!isValidOperation) {
    res.status(400).send('error: Invalid updates');
  }

  //const _id = req.params.id;
  const body = req.body;
  try {
    //const user = await User.findById(req.user._id);
    updates.forEach((update) => {
      req.user[update] = body[update];
    });
    await req.user.save();
    if (!req.user) {
      return res.status(404).send();
    }
    res.send(req.user);
  } catch (e) {
    res.status(400).send();
  }
});

router.delete('/user/me', auth, async (req, res) => {
  //const _id = req.params.id;
  try {
    // const user = await User.findByIdAndDelete(req.user._id);
    // if (!user) {
    //   return res.status(404).send();
    // }
    await req.user.remove();
    console.log("u delete ur self");
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

const upload = multer({
  //dest: 'avatar',
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    //if(!file.originalname.endsWith('.jpg')){
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('File must be a jpg OR jpeg OR png'));
    }
    cb(undefined, true);

    // cb(new Error('File must be a PDF'));
    // cb(undefind, true)
    // cb(undefind, false)
  }
});


router.post('/user/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({
    width: 240,
    height: 240
  }).png().toBuffer();;
  req.user.avatar = buffer;
  await req.user.save();
  res.send();
}, (error, req, res, next) => {
  res.status(400).send({
    error: error.message
  });
});

router.delete('/user/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get('/user/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set('Content-Type', 'image/jpg')
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
  res.send();
});


module.exports = router;
