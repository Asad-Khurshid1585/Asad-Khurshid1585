const knex = require('knex')({
    client: 'mysql',
    connection: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'test',
    },
    pool: { min: 0, max: 7 },
    migrations: {
        tableName: 'person',
    },
});
const sha256 = require("js-sha256");
const express = require('express');
const app = express();
const port = 3000;
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

app.post('/person', async (req, res) => {
    var { username, password, ID } = req.body;
    password = sha256(password);
    try {
        await knex('person').insert({ id: ID, username, password });
        res.status(201).json({ message: 'Row inserted successfully' });
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

app.patch('/updatePass', async (req, res) => {
    try {
        var { username, password, newPass } = req.body;
        password = sha256(password);
        newPass = sha256(newPass);
        if (!req.session.authenticated) {
            return res.status(404).json({ error: "Not Logged In" });
        }
        const data = await knex('person').where({ username }).first();
        if (!data || data.password !== password) {
            return res.status(404).json({ error: 'Password didn\'t Match' });
        }
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