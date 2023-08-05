const express = require('express');
const Task = require('../models/task.js');
const auth = require('../middleware/auth.js');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();

    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const pagination = {};
  const sort = {};
  try {

    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1].toLowerCase() === 'desc' ? -1 : 1;
    }

    if (req.query.limit && req.query.skip) {
      pagination = {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
      };
    }

    if (
      req.query.completed &&
      (req.query.completed === 'true' || req.query.completed === 'false')
    ) {
      match.completed = req.query.completed === 'true';
    }

    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        ...pagination,
        sort,
      },
    });
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isValidOpe = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOpe) {
    return res.status(400).send({ error: 'invalid update' });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
