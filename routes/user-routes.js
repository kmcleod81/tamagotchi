const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { User, Animal } = require('../models');

// keeping this for testing but, likely don't want this exposed later on
router.get('/', (req, res) => {
  User.findAll({})
    .then((results) => res.json(results))
    .catch((err) => { throw err; });
});

// get user / animals
router.get('/:username/animals', User.authenticateToken, (req, res) => {
  User.findOne({
    where: { username: req.params.username },
    include: Animal,
  })
    // todo check user and token are related
    .then((user) => {
      if (user.Animals) {
        res.json(user.Animals);
      } else {
        // todo conditional sends an empty array, so this is pointless
        throw new Error('No animals!');
      }
    })
    .catch((err) => res.send(`Something went wrong: ${err}.`));
});

// get user / animal
router.get('/:username/:animal', User.authenticateToken, (req, res) => {
  User.findOne({
    where: { username: req.params.username },
    include: [{
      model: Animal,
      where: { name: req.params.animal },
    }],
  })
    // todo check user and token are related
    .then((data) => {
      if (data.Animals) {
        res.json(data.Animals);
      } else {
        // todo conditional sends an empty array, so this is pointless
        throw new Error('No animals!');
      }
    })
    .catch((err) => res.send(`Something went wrong: ${err}.`));
});

// create
router.post('/create', (req, res) => {
  const { email, username, password } = req.body;

  User.create({
    email,
    username,
    password,
    uuid: uuidv4(),
  })
    .then((results) => res.json({ msg: `${results.username} created successfully!`, status: 201 }))
    .catch((err) => res.json({ msg: err.errors[0].message, status: 500 }));
});

// login
router.post('/login', (req, res) => {
  // expects {"username":"username-here", "password":"password-here"}
  User.findOne({ // CHECK USER EXISTS
    where: { username: req.body.username },
  })
    .then(async (user) => {
      if (User.validPassword(req.body.password, user.password)) { // CHECK PASSWORD IS CORRECT
        // CREATE TOKEN IF USER & PASSWORD ARE GOOD
        const accessToken = User.generateAccessToken(user);
        const refreshToken = jwt.sign(user.dataValues.username, process.env.REFRESH_TOKEN_SECRET);
        user.update({ refreshToken })
          .then((result) => {
            // SENDS TOKEN TO FRONTEND, WHERE IT CAN BE SAVED IN LOCALSTORAGE
            // todo add user validation for all actions using their uuid
            // https://github.com/megan-pg/tamagotchi/projects/1#card-41263925
            res.json({ accessToken, uuid: user.dataValues.uuid, status: 200 });
          });
      } else {
        res.json({ msg: 'Username OR Password not valid.', status: 400 });
      }
    })
    .catch((err) => res.json({ msg: err, status: 500 }));
});

// logout
router.post('/logout', (req, res) => {
  // todo need to delete the localstorage copy of authtoken as well on the frontend
  User.findOne({
    where: { username: req.body.username },
  })
    .then(async (user) => {
      const obj = {
        refreshToken: null,
      };
      return user.update(obj);
    })
    .then(() => res.sendStatus(204))
    .catch((err) => res.send(`Something went wrong ${err}.`));
});

// create new auth token
router.post('/token', (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) {
    return res.sendStatus(401);
  }
  User.findOne({
    where: { refreshToken },
  })
    .then((result) => {
      if (result.refreshToken == null) {
        return res.sendStatus(403);
      }
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
        const accessToken = generateAccessToken({ name: user.name });
        res.json(accessToken);
      });
    })
    .catch((err) => {
      return `Something went wrong: ${err}.`;
    });
});

// delete
router.delete('/delete', User.authenticateToken, (req, res) => {
  const { uuid } = req.body;
  User.findOne({
    where: { uuid },
  })
    .then(async (user) => user.destroy())
    .then((result) => res.send(`${result.username} succesfully deleted!`))
    .catch((err) => res.send(`Something went wrong ${err}.`));
});

// update
// todo: not sure about this one, as an update to the user, may require updates to all
// of their animals
// todo: what would we allow to be updated? email, pass, username
// todo maybe leave this one alone till everything else is buttoned up

module.exports = router;
