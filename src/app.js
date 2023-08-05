const express = require('express');
require('./db/mongoose.js');

const userRoute = require('./routes/user-router.js');
const taskRouter = require('./routes/task-router.js');

const app = express();

app.use(express.json());
app.use(userRoute);
app.use(taskRouter);

module.exports = app;
