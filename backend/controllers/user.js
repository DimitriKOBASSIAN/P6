const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');


exports.signup = (req, res, next) => {
    // Check if user already exists
    User.findOne({ email: req.body.email })
        .then(user => {
            if (user) {
                // User already exists
                return res.status(409).json({ error: 'User already exists!' });
            }
            // No user found, proceed with signup
            bcrypt.hash(req.body.password, 10)
                .then(hash => {
                    const newUser = new User({
                        email: req.body.email,
                        password: hash
                    });
                    newUser.save()
                        .then(() => res.status(201).json({ error: 'User created !' }))
                        .catch(error => res.status(400).json({ error }));
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
    // Check if user exists
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                // User does not exist
                return res.status(401).json({ error: 'User not found !' });
            }
            // Proceed with login
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    // Password do not match
                    if (!valid) {
                        return res.status(401).json({ error: 'incorrect password !' });
                    }
                    // Password match
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.JWT_SECRET,
                            { expiresIn: '12h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};