const express = require('express')
const app = express()
const { ejs, name } = require('ejs')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const lowDB = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { nanoid } = require("nanoid")
const md5 = require('md5');

const db = lowDB(new FileSync('db.json'))

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(cookieParser())

app.set("view engine", "ejs")

app.set("views", __dirname + "/public")

// posts = [
//     {
//         title: "Interesting title",
//         author: "William",
//         date: "idk",
//         content: "I made a <strong>Post</strong>",
//         img: "http://www.facets.la/wallpaper/W_2014_354.jpg"
//     }
// ]


function getPosts(){
    return db.get('posts').value()
}

function getNsfw(){
    return db.get('nsfw').value()
}

function getUsers(){
    return db.get('users').value()
}

function getCheatCodes(){
    return db.get('cheatcodes').value()
}

var users = getUsers()
var cheatcodes = getCheatCodes()

var tokens = []
var tokenLookup = []

function validateUser(token){
    users = getUsers()

    if(tokens[token]){
        for (let i = 0; i < users.length; i++) {
            if(tokens[token] == users[i].pass){
                return users[i]
            }
        }
    } else return false
}

function getUserlist(){
    users = getUsers()
    let out = []
    for (let i = 0; i < users.length; i++) {
        if(!users[i].hide){
            out.push(users[i].name)
        }
    }
    return out
}

app.get('/', (req, res) => {
    res.redirect('home')
})

app.post("/login", (req, res) => {
    users = getUsers()
    const inPass = req.body.password

    for (i = 0; i < users.length; i++) {
        if (users[i].pass == md5(inPass)) {

            if(tokenLookup[users[i].pass]){
                delete tokens[tokenLookup[users[i].pass]]
                delete tokenLookup[users[i].pass]

                console.log('prev token');
            } else {
                console.log('new token');
            }

            const token = nanoid(64)
            tokens[token] = users[i].pass
            tokenLookup[users[i].pass] = token
            res.cookie('Token', token, { maxAge: 60000 * 60 * 24 * 365 });

            res.redirect('/home')
            return;
        }
    }
    res.render("home", {posts: getPosts(), userList: getUserlist(), error: "Unknown password" })
});

app.get("/logout", (req, res) => {
    delete tokenLookup[tokens[req.cookies['Token']]]
    delete tokens[req.cookies['Token']]
    res.clearCookie("Token")
    res.redirect('/')
});

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/home", (req, res) => {    
    if(user = validateUser(req.cookies['Token'])){
        return res.render("home", {posts: getPosts(), userList: getUserlist(), user: user})          
    }

    res.render("home", {posts: getPosts(), userList: getUserlist()})
})

app.get("/make-post", (req, res) => {
    if(user = validateUser(req.cookies['Token'])){
        if (user.makePost){
            return res.render("make-post", {user: user})
        } else {
            return res.render("home", {posts: getPosts(), user: user, error: "No Access!" })
        }
    } 
    res.render("home", {posts: getPosts(), userList: getUserlist(), error: "No Access!" })
})

app.post("/make-post", (req, res) => {
    console.log(req.body);
    if(user = validateUser(req.cookies['Token'])){
        if(user.makePost){
            imgs = req.body.img.split(',')
            for(let i = 0; i < imgs.length; i++){
                imgs[i] = imgs[i].trim()
            }

            inPost = {
                id: nanoid(5),
                madeBy: getUsers()[i].name,
                author: getUsers()[i].name,
                title: req.body.title,
                author: req.body.author,
                date: req.body.date,
                content: req.body.content,
                img: imgs
            }

            db.get('posts')
                .unshift(inPost)
                .write()
        
            return res.render("home", {posts: getPosts(), userList: getUserlist(), user: user, success: "Success"})
        } else {
            return res.render("home", {posts: getPosts(), userList: getUserlist(), user: user, error: "No Access!" })
        }
    }
    return res.render("home", {posts: getPosts(), userList: getUserlist(), error: "No Access!" })
});

app.post("/delete-post", (req, res) => {
    if(user = validateUser(req.cookies['Token'])){
        posts = getPosts()
        for(let i = 0; i < posts.length; i++){
            if(posts[i].id == req.body.postId){
                
                if(user.deleteOthers || user.name == posts[i].madeBy){

                    db.get('posts')
                        .find({ id: req.body.postId })
                        .assign({ deleted: 1})
                        .write()
                    posts = getPosts()

                    return res.render("home", {posts: posts, userList: getUserlist(), user: user, success: "Success"})
                } else {
                    return res.render("home", {posts: posts, userList: getUserlist(), user: user, error: "No Access!" })
                }
            } 
        }
        return res.render("home", {posts: posts, userList: getUserlist(), user: user, error: "Post does not exist"})
    } else {
        return res.render("home", {posts: posts, userList: getUserlist(), error: "No Access!" })
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/bookmarks", (req, res) => {
    if(user = validateUser(req.cookies['Token'])){
        return res.render("bookmarks", {user: user})          
    }
    return res.render("home", {posts: getPosts(), userList: getUserlist(), error: "No Access!" })
})

app.get("/users/:user", (req, res) => {
    for (let i  = 0; i < getUsers().length; i++) {
        if (getUsers()[i].name == req.params.user) {
            return res.redirect(getUsers()[i].link)
        }
    }
    return res.render("home", {posts: getPosts(), userList: getUserlist(), user: validateUser(req.cookies['Token']), error: "User not founds" })
});

app.get("/change-pass", (req, res) => {
    if(user = validateUser(req.cookies['Token'])){
        return res.render("change-pass", {user: user})
    } 
    return res.render("home", {posts: getPosts(), userList: getUserlist(), error: "No Access!" })
})

app.post("/change-pass", (req, res) => {
    console.log(req.body);
    if(user = validateUser(req.cookies['Token'])){

            delete tokens[tokenLookup[users[i].pass]]
            delete tokenLookup[users[i].pass]

            const token = nanoid(64)
            tokens[token] = md5(req.body.password)
            tokenLookup[md5(req.body.password)] = token
            res.cookie('Token', token, { maxAge: 60000 * 60 * 24 * 365 });

            db.get('users')
                .find({pass: user.pass})
                .assign({ pass: md5(req.body.password)})
                .write()

    return res.render("change-pass", {user: user, success: "Success!"})
    }
    return res.render("home", {posts: getPosts(), userList: getUserlist(), error: "No Access!" })
});

app.get("/manage-user", (req, res) => {
    if(user = validateUser(req.cookies['Token'])){
        if(user.manageUser){
            return res.render("manage-user", {user: user, users: getUsers()})
        }
    } 
    return res.render("home", {posts: getPosts(), userList: getUserlist(), user: validateUser(req.cookies['Token']), error: "No Access!" })
})

app.post("/manage-user/make", (req, res) => {
    console.log(req.body);
    if(user = validateUser(req.cookies['Token'])){
        if(user.manageUser){
            newUser = {
                name: req.body.name,
                pass: md5(req.body.pass),
                link: req.body.link,
                bookmarks: [{
                    title: "DCRalph",
                    link: "https://dcralph.com"
                    }
                ]
            }
            if(req.body.makePost) newUser.makePost = 1
            if(req.body.deleteOthers) newUser.deleteOthers = 1
            if(req.body.manageUser) newUser.manageUser = 1
            if(req.body.hide) newUser.hide = 1

            db.get('users')
                .push(newUser)
                .write()

        }

    return res.render("manage-user", {user: user, users: getUsers(), success: "Success!"})
    }
    return res.render("home", {posts: getPosts(), userList: getUserlist(), error: "No Access!" })
});

app.post("/manage-user/edit/:name", (req, res) => {
    console.log(req.body);
    if(user = validateUser(req.cookies['Token'])){
        if(user.manageUser){

            change = {
                makePost: req.body.makePost ? 1 : 0,
                deleteOthers: req.body.deleteOthers ? 1 : 0,
                manageUser: req.body.manageUser ? 1 : 0,
                hide: req.body.hide ? 1 : 0,
                link: req.body.link
            }

            if(req.body.name != req.params.name){
                change.name = req.body.name
            }

            if(req.body.pass != ''){
                change.pass = md5(req.body.pass)
                console.log('new pass');
            }
            users = getUsers()
            for (let i = 0; i < users.length; i++) {
                if(users[i].name == req.body.name){
                    delete tokens[tokenLookup[users[i].pass]]
                    delete tokenLookup[users[i].pass]
                }
            }

            db.get('users')
                .find({name: req.params.name})
                .assign(change)
                .write()

        }

    return res.render("manage-user", {user: user, users: getUsers(), success: "Success!"})
    }
    return res.render("home", {posts: getPosts(), userList: getUserlist(), error: "No Access!" })
});

app.post("/manage-user/delete/:name", (req, res) => {
    console.log(req.body);
    if(user = validateUser(req.cookies['Token'])){
        if(user.manageUser){

            db.get('users')
                .remove({name: req.params.name})
                .write()

        }

    return res.render("manage-user", {user: user, users: getUsers(), success: "Success!"})
    }
    return res.render("home", {posts: getPosts(), userList: getUserlist(), error: "No Access!" })
});

app.post("/cheatcodes", (req, res) => {
    msg = null
    for (i = 0; i < getCheatCodes().length; i++) {
        if (getCheatCodes()[i].code == req.body.cheatcode) {
            msg = getCheatCodes()[i].msg
        }
    }
    
    if(msg){
        res.render("home", {posts: getPosts(), userList: getUserlist(), user: validateUser(req.cookies['Token']), success: msg})
    } else {
        res.render("home", {posts: getPosts(), userList: getUserlist(), user: validateUser(req.cookies['Token']), error: "Unknown code" })
    }
    
});


app.get("/*", (req, res) => {
    res.redirect('home')
})

app.get('/privacy-policy', (req, res) => {
    res.render('privacy-policy');
})


var server = app.listen(4000, () => {
    console.log('server is running on port', server.address().port);
})