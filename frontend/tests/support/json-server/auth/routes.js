const responses = require('./responses')
const users = require('../db.json')['user']

module.exports = {
  signin(req, res) {
    const email = req.body.email
    const password = req.body.password

    const userExists =
      users.findIndex(
        (u) => u.email === email && u.password === password
      ) !== -1

    if (!userExists) {
      res.status(400).send('Bad credentials')
    } else {
      users.push({ email, password })
      res.status(200).send(responses.token.withTenant)
    }
  },
  signup(req, res) {
    const email = req.body.email
    const password = req.body.password

    const userExists =
      users.findIndex((u) => u.email === email) !== -1

    if (userExists) {
      res.status(400).send('Email is already in use')
    } else {
      users.push({ email, password })
      res.status(200).send(responses.token.withoutTenant)
    }
  },
  me(req, res) {
    const tokentType = req.headers.authorization
      ? req.headers.authorization.split('Bearer ')[1]
      : null
    res.jsonp(responses.me[tokentType])
  },
  passwordReset(req, res) {
    const token = req.body.token

    if (!token) {
      res
        .status(400)
        .send(
          'Password reset link is invalid or has expired'
        )
    } else {
      res.sendStatus(200)
    }
  },
  changePassword(req, res) {
    res.sendStatus(200)
  },
  profile(req, res) {
    res.sendStatus(200)
  },
  verifyEmail(req, res) {
    res.sendStatus(200)
  },
  sendEmailAddressVerificationEmail(req, res) {
    res.sendStatus(200)
  },
  sendPasswordResetEmail(req, res) {
    const email = req.body.email

    const userExists =
      users.findIndex((u) => u.email === email) !== -1

    if (!userExists) {
      res.status(400).send('Email not recognized')
    } else {
      res.sendStatus(200)
    }
  }
}
