const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const { MongoClient } = require("mongodb-legacy")

function initialize (passport, getUserByEmail) {
    const authenticateUser = async (email, password, done) => {
        const client = await MongoClient.connect(url)
        const database = client.db("Petstore")
        const user = database.collection('Users').findOne({ email: email })
        //const user = getUserByEmail(email)
        if (user == null) {
            return done(null, false, { message: 'No user with that email' })
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: 'Password incorrect' })
            }
        } catch {

        }
    }

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => {})
    passport.deserializeUser( (id, done) => {} )
}

//module.exports = initialize