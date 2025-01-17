require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const path = require('path');

app.use('/images', express.static(path.join(__dirname, 'images')));
const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');

app.use(express.json());

mongoose.connect(process.env.MongoDB_login)
  .then(() => console.log('MongoDB connected!'))
  .catch(() => console.log('MongoDB connexion failed !'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);

module.exports = app;