const knex = require('knex')({
    client: 'mysql',
    connection: {
      host: 'bowrzlfyl9fjknk7g5v8-mysql.services.clever-cloud.com',
      port: 3306,
      user: 'u6gvvm1okumfb4mi',
      password: 'WCYBQ1GQSOZFLkdpIYPY',
      database: 'bowrzlfyl9fjknk7g5v8',
    },
    pool: { min: 0, max: 7 },
    migrations: {
        tableName: 'person',
    },
});
const sha256 = require("js-sha256");
const express = require('express');
const app = express();
const port = 8080;
const bodyparser = require("body-parser");
const session = require('express-session');

app.use(session({
    secret: 'some secret',
    cookie: {maxAge: 120000},
    saveUninitialized: false
}));
app.use(express.json());
app.use(bodyparser.urlencoded({extended: false}));

app.get('/person', async (req, res) => {
    const { ID } = req.query;
    try {
        const data = await knex('person').where({ id: ID }).first();
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: 'Row not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from the database' });
    }
});

const validatePasswordSignup = (req,res,next) => {
    var { username, password } = req.body;
    if (password.length() < 8){
        return res.status(400).json({error: "Password must be atleast 8 chracters long"});
    }
    if(password.search(/[a-z]/) === -1){
        return res.status(400).json({error: "Password must contain at least one lower case letter"});
    }
    if(password.search(/[A-Z]/) === -1){
        return res.status(400).json({error: "Password must contain at least one upper case letter"});
    }
    if(password.search(/[0-9]/i) === -1){
        return res.status(400).json({error: "Password must contain at least one number"});
    }
    next();
};

app.post('/signup', validatePasswordSignup, async (req, res) => {
    var { email, password } = req.body;
    password = sha256(password);
    try {
        await knex('person').insert({ email, password });
        res.status(201).json({ message: 'User Registered Successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to insert data into the database' });
    }
});

app.post('/login', async(req, res) => {
    var {username, password} = req.body;
    password = sha256(password);
    const data = await knex('person').where({ username }).first();
    if (data){
        if (username == data.username && password == data.password){
            req.session.authenticated = true;
            res.status(200).json({message: "Ok Logged in."});
        }
        else{
            res.status(404).json({message: "Bad Credentials"});
        }
    }
    else res.status(403).json({error: "User not found"});
});
// middleware to check if the user requesting updatePass is logged in or not
app.use((req, res, next) => {
    if (!req.session.authenticated) {
        return res.status(400).json({ error: "Not Logged In" });
    }
    next();
});
// middleware to check if the old password matches
app.use(async(req, res, next) => {
    var{username, password} = req.body;
    password = sha256(password);
    const data = await knex('person').where({ username }).first();
    if (!data || data.password !== password) {
        return res.status(400).json({ error: 'Password didn\'t Match' });
    }
    next();
});
// middleware to check if the newPass matches the criteria of the password
const validatePasswordUpdate = (req,res,next) => {
    var { username, password, newPass } = req.body;
    if (newPass.length() < 8){
        return res.status(400).json({error: "Password must be atleast 8 chracters long"});
    }
    if(newPass.search(/[a-z]/) === -1){
        return res.status(400).json({error: "Password must contain at least one lower case letter"});
    }
    if(newPass.search(/[A-Z]/) === -1){
        return res.status(400).json({error: "Password must contain at least one upper case letter"});
    }
    if(newPass.search(/[0-9]/i) === -1){
        return res.status(400).json({error: "Password must contain at least one number"});
    }
    next();
};
app.patch('/updatePass', validatePasswordUpdate, async (req, res) => {
    try {
        var { username, password, newPass } = req.body;
        password = sha256(password);
        newPass = sha256(newPass);
        const data = await knex('person').where({ username }).first();
        await knex('person').where({ username }).update({ password: newPass });
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});