const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      default: 0,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      validate(val) {
        if (!validator.isEmail(val)) {
          throw new Error('please enter a valid email !');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(val) {
        if (val.length < 6) {
          throw new Error('Password must be greater than 6 characters');
        }
        if (val.toLowerCase().includes('password')) {
          throw new Error('Password can not includes password word');
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: { type: Buffer },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual('tasks', {
  ref: 'Task',
  foreignField: 'owner',
  localField: '_id',
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObj = user.toObject();

  delete userObj.tokens;
  delete userObj.password;
  delete userObj.avatar;

  return userObj;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('unable to login.');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('unable to login.');
  }
  return user;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user.id.toString() }, process.env.JWT_SECRET);

  user.tokens = [...user.tokens, { token }];
  await user.save();

  return token;
};

userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

userSchema.pre('remove', async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
