const express = require('express')
const app = express()
const { ejs, name } = require('ejs')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const lowDB = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

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
    const postsIN = db.get('data').value()
    return postsIN
}

const users = [
    {
        name: 'William',
        pass: '!',
        makepost: 1,
        bookmarks: [
            {
                title: "Google",
                link: "https://www.google.co.nz"
            },
            {
                title: "Github",
                link: "https://www.github.com"
            }
        ]
    },
    {
        name: 'Michael',
        pass: 'buildingnext',
        bookmarks: [
            {
                title: "Google",
                link: "https://www.google.co.nz"
            },
            {
                title: "Github",
                link: "https://www.github.com"
            }
        ]
    }
]

const cheatcodes = [{
    code: 69,
    msg: "nice"
    },{
    code: 1234,
    msg: "Wow u can count"
    }
]

app.get('/', (req, res) => {
    res.redirect('home')
})

app.post("/login", (req, res) => {
    for (i = 0; i < users.length; i++) {
        if (users[i].pass == req.body.password) {

            res.cookie('password', req.body.password, { maxAge: 60000 * 60 * 24 * 365 });

            res.redirect('/home')
            return;
        }
    }
    res.render("home", {posts: getPosts(), error: "Unknown password" })
});

app.get("/logout", (req, res) => {
    res.clearCookie("password")
    res.redirect('/')
});

// app.get('/home', (req, res) => {
//     res.render('home', {posts: posts});
// })

app.get("/home", (req, res) => {
    if (req.cookies['password']) {
        for (i = 0; i < users.length; i++) {
            if (users[i].pass == req.cookies['password']) {
            
                res.render("home", {posts: getPosts(), user: users[i]})    
                return        
            }
        }
    } 
    res.render("home", {posts: getPosts()})
})

app.get("/bookmarks", (req, res) => {
    if (req.cookies['password']) {
        for (i = 0; i < users.length; i++) {
            if (users[i].pass == req.cookies['password']) {
            
                res.render("bookmarks", {user: users[i]})
                return
            }
        }
    } 
    res.render("home", {posts: getPosts(), error: "No Access!" })
})

app.get("/make-post", (req, res) => {
    if (req.cookies['password']) {
        for (i = 0; i < users.length; i++) {
            if (users[i].pass == req.cookies['password']) {
                if (users[i].makepost){
                    res.render("make-post", {user: users[i]})
                } else {
                    res.render("home", {posts: getPosts(),user: users[i], error: "No Access!" })
                }
                return
            }
        }
    } 
    res.render("home", {posts: getPosts(), error: "No Access!" })
})

app.post("/make-post", (req, res) => {
    console.log(req.body);
    if (req.cookies['password']) {
        for (i = 0; i < users.length; i++) {
            if (users[i].pass == req.cookies['password']) {
                if(users[i].makepost){
                    inPost = {
                        title: req.body.title,
                        author: req.body.author,
                        date: req.body.date,
                        content: req.body.content,
                        img: req.body.img
                    }
    
                    // posts.unshift(inPost)
                    db.get('data')
                        .unshift(inPost)
                        .write()
                
                    res.render("make-post", {user: users[i], success: "Success"})
                } else {
                    res.render("home", {posts: getPosts(), user: users[i], error: "No Access!" })
                }
                return
            }
        }
    }
    res.render("home", {posts: getPosts(), error: "No Access!" })
});

app.post("/cheatcodes", (req, res) => {
    msg = null
    for (i = 0; i < cheatcodes.length; i++) {
        if (cheatcodes[i].code == req.body.cheatcode) {
            msg = cheatcodes[i].msg
            
        }
    }
    
    if (req.cookies['password']) {
        for (i = 0; i < users.length; i++) {
            if (users[i].pass == req.cookies['password']) {
                if(msg){
                    res.render("home", {posts: getPosts(), user: users[i], success: msg})
                } else {
                    res.render("home", {posts: getPosts(), user: users[i], error: "Unknown code" })
                }
            }
        }
    } else {
        if(msg){
            res.render("home", {posts: getPosts(), success: msg})
        } else {
            res.render("home", {posts: getPosts(), error: "Unknown code" })
        }
    }
});

app.get('/privacy-policy', (req, res) => {
    res.render('privacy-policy');
})


var server = app.listen(4000, () => {
    console.log('server is running on port', server.address().port);
})
