const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth')
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
  console.log(task);
});

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt_asc
// GET /tasks?sortBy=motifiedAt_desc
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  if(req.query.sortBy){
    const parts = req.query.sortBy.split('_');
    sort[parts[0]] = (parts[1]=== 'desc') ? -1 : 1 ; // 1 for asc // -1 for desc
  }

  try {
    //  const tasks = await Task.find({ owner: req.user._id});
    // res.send(tasks);
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip:parseInt(req.query.skip),
        sort
      }
    }).execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/task/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({
      _id,
      owner: req.user._id
    });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
  console.log(req.params);
});

router.patch('/task/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowUpdate = [
    'description',
    'completed'
  ]

  const isValidOperation = updates.every((update) => {
    return allowUpdate.includes(update);
  });
  if (!isValidOperation) {
    res.status(400).send('error: Invalid updates');
  }

  const body = req.body;
  try {

    const task = await Task.findById({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send('task not found');
    }
    updates.forEach((update) => {
      task[update] = body[update];
    });
    await task.save();

    // const task = await Task.findByIdAndUpdate(_id, body, {
    //   new: true,
    //   runValidators: true
    // });
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/task/:id', auth, async (req, res) => {
  //  const _id = req.params.id;
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
