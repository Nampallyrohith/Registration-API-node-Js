const express = require("express");
const path = require("path");
const {open} = require("sqlite")
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBServer = async () =>{
    try {
        db = await open({
            filename:dbPath,
            driver: sqlite3.Database
        })
        app.listen(8080, ()=> {
            console.log("Server is live on 8080");
        });
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}
initializeDBServer();


//API 1
// POST

app.post("/register", async (request, response) => {
    const {username, name, password, gender, location} = request.body;
    let hashedPassword = await bcrypt.hash(password, 10);
    const selectedQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const query = await db.get(selectedQuery);
    if (query !== undefined) {
        response.status(400)
        response.send("User already exists");
    }
    else{
        const createUser = `
        INSERT INTO user (username,name, password, gender, location) VALUES
        (
            '${username}',
            '${name}',
            '${hashedPassword}', 
            '${gender}', 
            '${location}'
        );
        `;
        const insertQuery = await db.run(createUser);
        if (request.body.password.length < 5){
            response.status(400);
            response.send("Password is too short");
        }
        else{
            response.status(200);
            response.send("User created successfully")
        }
    }
});

app.post("/login", async (request, response) => {
    const {username, password} = request.body;
    const selectedQuery = `SELECT * FROM user WHERE username = '${username}'`;

    const query = await db.get(selectedQuery);
    console.log(query);
    if (username === undefined) {
        response.status(400);
        response.send("Invalid user");
    }
    else{
        const checkPassword = await bcrypt.compare(password, query.password);
        if (checkPassword === true) {
            response.status(200);
            response.send("Login success!")
        } else{
            response.status(400);
            response.send("Invalid password");
        }
    }
})

//API 3
// Change password

app.put("/change-password", async (request, response) => {
    const {username, oldPassword, newPassword} = request.body;
    const selectedQuery = `SELECT * FROM user WHERE username = '${username}'`;

    const query = await db.get(selectedQuery);
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const checkOldPassword = await bcrypt.compare(oldPassword, query.password);
    if (checkOldPassword === false) {
        response.status(400)
        response.send("Invalid current password")
    } else{
        if (newPassword.length < 5) {
            response.status(400);
            response.send("Password is too short");
        } else{
            const newPasswordAdding = `
            UPDATE user 
            SET
            password = '${hashedNewPassword}'
            `;
            const updatedPassword = await db.run(newPasswordAdding);
            response.status(200);
            response.send("Password updated");
        }
    }
})

module.exports = app;