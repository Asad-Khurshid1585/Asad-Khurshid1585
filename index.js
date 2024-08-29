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
        tableNames: ['person', 'airportData']
    },
});
const sha256 = require("js-sha256");
const express = require('express');
const app = express();
const port = 8080;
const bodyparser = require("body-parser");
const session = require('express-session');

const validatePassword = (password, res) => {
    if (password.length < 8){
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
    if (password.search(/[^a-zA-Z0-9]/) === -1) {
        return res.status(400).json({ error: "Password must contain at least one special character" });
    }
    return null;
}

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

const validateSignUp = (req, res, next) => {
    var { email, password } = req.body;
    const error = validatePassword(password, res);
    if (error) return;
    next();
};

app.post('/signup', validateSignUp, async (req, res) => {
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
    var {email, password} = req.body;
    password = sha256(password);
    const data = await knex('person').where({ email }).first();
    if (data){
        if (email == data.email && password == data.password){
            req.session.authenticated = true;
            res.status(200).json({message: "Ok Logged in."});
        }
        else{
            res.status(404).json({message: "Bad Credentials"});
        }
    }
    else res.status(403).json({error: "User not found"});
});

const validateUpdatePass = async(req,res,next) => {
    if (!req.session.authenticated) {
        return res.status(400).json({ error: "Not Logged In" });
    }
    var { email, password, newPass } = req.body;
    password = sha256(password);
    const data = await knex('person').where({ email }).first();
    if (!data || data.password !== password) {
        return res.status(400).json({ error: 'Password didn\'t Match' });
    }
    const error = validatePassword(newPass, res);
    if (error) return;
    next();
};

app.patch('/updatePass', validateUpdatePass, async (req, res) => {
    try {
        var { email, password, newPass } = req.body;
        password = sha256(password);
        newPass = sha256(newPass);
        const data = await knex('person').where({ email }).first();
        await knex('person').where({ email }).update({ password: newPass });
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.use((req,res, next) =>{
    if (!req.session.authenticated) {
        return res.status(400).json({ error: "Not Logged In" });
    }
    next();
});

app.get('/airports/search', async(req,res) => {
    var {name} = req.body;
    try {
        const data = await knex('airportData').where({ IataCode: name }).first();
        if (data) {
            res.json(data);
        } else {
            res.status(404).json({ error: 'Airport not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from the database' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});