const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schéma pour l'utilisateur
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Endpoint pour créer un nouvel utilisateur
app.post('/api/users', (req, res) => {
  const newUser = new User({ username: req.body.username });
  newUser.save((err, savedUser) => {
    if (err) return res.status(500).json({ error: 'Error saving user' });
    res.json({ username: savedUser.username, _id: savedUser._id });
  });
});

// Endpoint pour obtenir tous les utilisateurs
app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if (err) return res.status(500).json({ error: 'Error fetching users' });
    res.json(users);
  });
});

// Endpoint pour ajouter un exercice à un utilisateur
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  User.findById(userId, (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });

    const exercise = new Exercise({
      userId,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date(),
    });

    exercise.save((err, savedExercise) => {
      if (err) return res.status(500).json({ error: 'Error saving exercise' });
      res.json({
        username: user.username,
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: savedExercise.date.toDateString(),
        _id: userId,
      });
    });
  });
});

// Endpoint pour obtenir le journal des exercices d'un utilisateur
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  User.findById(userId, (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });

    let query = { userId };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    Exercise.find(query).limit(parseInt(limit) || 0).exec((err, exercises) => {
      if (err) return res.status(500).json({ error: 'Error fetching logs' });

      res.json({
        username: user.username,
        count: exercises.length,
        _id: userId,
        log: exercises.map(ex => ({
          description: ex.description,
          duration: ex.duration,
          date: ex.date.toDateString(),
        })),
      });
    });
  });
});

// Lancer le serveur
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
