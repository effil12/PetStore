var express = require('express');
var bodyParser = require('body-parser');
const { MongoClient } = require("mongodb-legacy")
const bcrypt = require("bcrypt")
const initializePassport = require('./passport-config')
const passport = require('passport')
var app = express();
var port = process.env.PORT || 8080;
const url = "mongodb://sa:UnsecureD3vP4ss@localhost:27017/?authMechanism=DEFAULT&socketTimeoutMS=5000&connectTimeoutMS=5000"

async function petStore(request) {
    const httpMethod = request.method
    const params = request.params
    let pet = request.body
    let client = null
    try {
        client = await MongoClient.connect(url)
        let database = client.db("Petstore")
        let ifPetExists = await database.collection("Pets").countDocuments({ _id: pet._id })

        switch (httpMethod) {
            case "POST":
                if (!ifPetExists) {
                    await database.collection("Pets").insertOne(pet)
                }
                break
            case "PUT":
                if (ifPetExists) {
                    await database.collection("Pets").replaceOne({ _id: pet._id }, pet)
                    return pet
                } else {
                    return
                }
                break
            case "GET":
                return await database.collection("Pets").findOne({ _id: Number(params.id) })
                break
        }
    } catch (err) {
        console.error(err + "this is error in catch")
    }
    finally {
        if (client !== null) {
            await client.close()
        }
    }
}

let generateClientErrResponse = (pet, request, callBack) => {
    if (pet == null) {
        return {
            code: 404,
            msg: "Pet not found"
        }
    }
    const { _id, name, category, status } = pet
    console.log(_id, name, category, status)
    console.log(request.body)
    if (typeof _id !== "number") {
        return {
            code: 400,
            msg: "id must be number"
        }
    }
    else if (typeof name !== "string") {
        return {
            code: 400,
            msg: "name must be string"
        }
    }
    else if (typeof category !== "string") {
        return {
            code: 400,
            msg: "category must be string"
        }
    }
    else if (status !== "available") {
        return {
            code: 400,
            msg: "Invalid status value"
        }
    } else {
        return callBack(request)
    }
}

let generateSuccessResponse = (request) => {
    console.log(typeof request)
    const httpMethod = request.method
    console.log(`${httpMethod}: Call Requested`)


    switch (httpMethod) {
        case "POST":
            return {
                code: 201,
                msg: "Pet created!"
            }
            break
        case "PUT":
            return {
                code: 200,
                msg: "Pet updated!"
            }
            break
        case "GET":
            return {
                code: 200,
                msg: "OK"
            }
            break
    }
}

app.set("view-engine", "ejs")

app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))

app.post("/pet", async (request, response) => {
    console.log(request.body)
    initializePassport(passport, async function (email) {
        const client = await MongoClient.connect(url)
        const database = client.db("Petstore")
        //finn ut hvordan jeg kan sammenligne email fra inout fuildene og den som er lagret i databasen fra registreringen
        //database.collection('Users').findOne({ email: request.b })
    })
    let pet = request.body

    let httpObj = generateClientErrResponse(pet, request, generateSuccessResponse)
    if (httpObj.code === 201) {
        await petStore(request)
        response.status(httpObj.code).send(httpObj.msg)
    } else {
        response.status(httpObj.code).send(httpObj.msg)
    }
})

app.get("/pet/:id", async (request, response) => {
    let pet = await petStore(request)

    let httpObj = generateClientErrResponse(pet, request, generateSuccessResponse)
    if (httpObj.code === 200) {
        response.status(httpObj.code).send(pet)
    } else {
        response.status(httpObj.code).send(httpObj.msg)
    }
})

app.get("/pet/status/:status", async (request, response) => {
    const status = request.params.status
    response.send(status)
});

app.put("/pet", async (request, response) => {
    let updateToPet = request.body

    let httpObj = generateClientErrResponse(updateToPet, request, generateSuccessResponse)
    console.log(httpObj)
    if (httpObj.code === 200 && updateToPet !== null) {
        await petStore(request)
        response.status(httpObj.code).send(httpObj.msg)
    } else {
        response.status(httpObj.code).send(`${httpObj.msg}: pet = null`)
    }
})

app.get('/', (request, response) => {
    response.render("template.ejs", { name: "Ali" })
})

app.get('/login', (request, response) => {
    response.render("login.ejs")
    //initializePassport(passport)
})
app.post('/login', (request, response) => {

})

app.get('/register', (request, response) => {
    response.render("register.ejs")
})
app.post('/register', async (request, response) => {
    try {
        const hashedPassword = await bcrypt.hash(request.body.password, 10)
        const client = await MongoClient.connect(url)
        const database = client.db("Petstore")

        database.collection("Users").insertOne({
            name: request.body.name,
            email: request.body.email,
            password: hashedPassword
        })
        response.redirect('/login')
    } catch {
        response.redirect('/register')
    }
})

app.listen(port, function () {
    var datetime = new Date();
    var message = "Server running on Port:- " + port + " Started at :- " + datetime;
    console.log(message);
});