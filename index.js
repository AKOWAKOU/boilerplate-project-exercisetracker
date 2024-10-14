// index.js
// Importer les modules nécessaires
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Créer l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// URI de connexion à MongoDB
const mongoURI = 'mongodb+srv://user:z2nNaq8BcLmKyAyZ@cluster0.4y4b0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster'

// Connexion à MongoDB
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schéma et modèle de l'utilisateur
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Schéma et modèle d'exercice
const exerciseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Endpoint pour créer un nouvel utilisateur
app.post('/api/users', async (req, res) => {
    const newUser = new User({ username: req.body.username });
    try {
        const savedUser = await newUser.save();
        res.json({ username: savedUser.username, _id: savedUser._id });
    } catch (err) {
        res.status(500).send('Error creating user');
    }
});

// Endpoint pour obtenir tous les utilisateurs
app.get('/api/users', async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

// Endpoint pour ajouter un exercice à un utilisateur
app.post('/api/users/:_id/exercises', async (req, res) => {
    const { description, duration, date } = req.body;
    const exerciseDate = date ? new Date(req.body.date) : new Date();
    const exercise = new Exercise({
        userId: req.params._id,
        description,
        duration,
        date: exerciseDate,
    });

    try {
        const savedExercise = await exercise.save();
        const user = await User.findById(req.params._id);
        res.json({
            username: user.username,
            description: savedExercise.description,
            duration: savedExercise.duration,
            date: savedExercise.date.toDateString(),
            _id: savedExercise.userId,
        });
    } catch (err) {
        res.status(500).send('Error adding exercise');
    }
});

// Endpoint pour obtenir le log d'exercice d'un utilisateur
app.get('/api/users/:_id/logs', async (req, res) => {
    const { from, to, limit } = req.query;
    const filter = { userId: req.params._id };
    if (from) filter.date = { $gte: new Date(from) };
    if (to) filter.date = { ...filter.date, $lte: new Date(to) };

    const exercises = await Exercise.find(filter).limit(parseInt(limit) || 0);
    const user = await User.findById(req.params._id);
    res.json({
        username: user.username,
        count: exercises.length,
        _id: user._id,
        log: exercises.map(ex => ({
            description: ex.description,
            duration: ex.duration,
            date: ex.date.toDateString(),
        })),
    });
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Your app is listening on port ${PORT}`);
});
