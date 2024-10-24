const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const users = require('./users').userDB;
const bcrypt = require('bcrypt');
const { Store } = require('express-session');
const res = require('express/lib/response');

app.use(session({
	secret: 'secretidhere',
	resave: true,
	saveUninitialized: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

app.post("/webchat", (req, res) => {
    res.sendFile(__dirname + "/public/webChat.html")
});

app.post("/server", (req, res) => {
    console.log("server request received");
    req.body.username = req.session.username;
});

app.post('/register', async (req, res) => {
	try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (!foundUser) {
            let hashPassword = await bcrypt.hash(req.body.password, 10);
            let newUser = {
                id: Date.now(),
                username: req.body.username,
                email: req.body.email,
                password: hashPassword,
            };
            users.push(newUser);
            console.log('User list', users);
            res.send("<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='./login.html'>login</a></div><br><br><div align='center'><a href='./register.html'>Register another user</a></div>");
        } else {
            res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='./register.html'>Register again</a></div>");
        }
    } catch{
        res.send("Internal server error");
    }
});

app.post('/login', async (req, res) => {
    try{
        let foundUser = users.find((data) => req.body.email == data.email);
        console.log(foundUser);
        if (foundUser) {
            let submittedPass = req.body.password; 
            let storedPass = foundUser.password; 
            const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
            if (passwordMatch) {
                let usrname = foundUser.username;
                req.session.username = foundUser.username;
                res.redirect(307, "/webchat")
            } else {
                res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
            }
        }
        else {
            let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
            await bcrypt.compare(req.body.password, fakePass);
            console.log("email not found");
            res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
        }
    } catch{
        res.send("Internal server error");
    }
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        let dateOb = new Date();
        let hours = dateOb.getHours();
        let mins = dateOb.getMinutes();
        let secs = dateOb.getSeconds();
        io.emit('chat message', "[" + hours + ":" + mins + ":" + secs + "] " + msg);
        });
    });

server.listen(3000, () => {
    console.log('listening on *:3000');
});