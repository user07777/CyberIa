const express = require('express');
const app = express();
const path = require('path');
var md5 = require('md5');
const multer = require('multer');
var mysql = require('mysql');
var md5 = require('md5');
const upload = multer({
    dest: 'uploads/'
});
var bodyParser = require('body-parser')
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));
let cookie_parser = require('cookie-parser');



/*
+----------+--------------+------+-----+---------+-------+
| Field    | Type         | Null | Key | Default | Extra |
+----------+--------------+------+-----+---------+-------+
| TITLE    | varchar(255) | NO   | PRI | NULL    |       |
| SUBTITLE | varchar(255) | NO   |     | NULL    |       |
| REPLYS   | varchar(255) | NO   |     | NULL    |       |
| AUTHOR   | varchar(255) | NO   |     | NULL    |       |
| IMG      | varchar(255) | NO   |     | NULL    |       |
| THEME    | varchar(255) | NO   |     | NULL    |       |
+----------+--------------+------+-----+---------+-------+
6 rows in set (0.00 sec)

*/
connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'blog'
});
connection.connect((err) => console.log(err));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cookie_parser('cookie'))
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())



app.get('/', function(req, res) {
    const options = {
        root: path.join(__dirname)
    };
    res.sendFile("/public/index.html", options, (err) => {})
});
app.get("/imgByAuthor",(req,res) => {
    try {
        connection.query('select img from USUARS where nickname=?;', [req.query.nick], (err, ress, fields) => {
            if (err) {
                res.write(err.code)
            } else {
                if (JSON.parse(JSON.stringify(ress)) != "") {
                    res.send(JSON.stringify(ress[0]))
                } else {
                    res.redirect("/404")
                }
            }
        })
    } catch (err) {
        res.send(err.code)
    }
})
app.get("/topic",(req,res)=>{
 res.sendFile(__dirname+"/public/topic.html",{headers: {
    'Access-Control-Expose-Headers': 'User',
    'id': JSON.stringify(req.query.id),
}})
})


app.post("/newpost",(req,res) => {
    /*
+----------+--------------+------+-----+---------+-------+
| Field    | Type         | Null | Key | Default | Extra |
+----------+--------------+------+-----+---------+-------+
| TITLE    | varchar(255) | NO   | PRI | NULL    |       |
| SUBTITLE | varchar(255) | NO   |     | NULL    |       |
| REPLYS   | varchar(255) | NO   |     | NULL    |       |
| AUTHOR   | varchar(255) | NO   |     | NULL    |       |
| IMG      | varchar(255) | NO   |     | NULL    |       |
| THEME    | varchar(255) | NO   |     | NULL    |       |
+----------+--------------+------+-----+---------+-------+
6 rows in set (0.00 sec)

*/
    const title=req.body.title
    const content=req.body.content
    const subtitle=req.body.subtitle
    const author=req.signedCookies.user
    const theme=req.body.theme
    if (!req.signedCookies.user) {
        res.redirect("/404")
        return
    }
    try {
        connection.query('select * from POST where TITLE LIKE ? OR CONTENT LIKE ? OR SUBTITLE LIKE ? ;', [title, content,subtitle], (err, ress, fields) => {
            if (err) {
                res.send(err.code)
            } else {
                if (JSON.parse(JSON.stringify(ress)) != "") {
                    res.send("duplicated post")
                } else {
                    //stuf
                    try {
                        connection.query('INSERT INTO POST VALUES (?,?,?,?,?,?,?);', [
                            title, 
                            subtitle, 
                            "0AA", 
                            author,
                             "0AA",
                            theme,
                            content], (err, ress, fields) => {
                            if (err) {
                                console.log(err)
                                res.send(err.code)
                                return
                            }

                            connection.commit(function(err) {
                                if (err) {
                                    console.log(err.message);
                                    connection.rollback(function() {});
                                    res.send(err.code)
                                    return
                                }
                            })
                            res.redirect("/")
                        })
                    } catch (err) {
                        res.send(err.code)
                    }
                }
            }
        })
    } catch (err) {
        res.write(err.code)
    }
})
app.get('/register', function(req, res) {
    const options = {
        root: path.join(__dirname)
    };
    if (req.signedCookies.user) {
        res.redirect("/404")
        return
    }
    res.sendFile("/public/register.html", options, (err) => {})
});
app.get("/profile/",(req,res) => {
    nick = req.query.nick || ""
    if(nick!=''){
        try {
            connection.query('select nickname,img,bio from USUARS where nickname=?;', [nick], (err, ress, fields) => {
                if (err) {
                    res.write(err.code)
                } else {
                    if (JSON.parse(JSON.stringify(ress)) != "") {
                        res.sendFile(__dirname+"/public/profile.html",{headers: {
                            'Access-Control-Expose-Headers': 'User',
                            'obj': JSON.stringify(ress[0]),
                        }})
                    } else {
                        res.redirect("/404")
                    }
                }
            })
        } catch (err) {
            res.send(err.code)
        }
    }else{
        try {
            connection.query('select nickname,img,bio from USUARS where nickname=?;', [(req.signedCookies.user)], (err, ress, fields) => {
                if (err) {
                    res.write(err.code)
                } else {
                    if (JSON.parse(JSON.stringify(ress)) != "") {
                        res.sendFile(__dirname+"/public/profile.html",{headers: {
                            'Access-Control-Expose-Headers': 'User',
                            'obj': JSON.stringify(ress[0]),
                        }})
                    } else {
                        res.redirect("/404")
                    }
                }
            })
        } catch (err) {
            res.send(err.code)
        }
    }
})
app.post('/login', (req, res) => {
    const user = req.body.email;
    const pwd = req.body.pwd
    if (req.signedCookies.user) {
        res.redirect("/404")
        return
    }
    try {
        connection.query('select nickname from USUARS where email=? AND pwd=?;', [user, md5(pwd)], (err, ress, fields) => {
            if (err) {
                res.write(err.code)
            } else {
                if (JSON.parse(JSON.stringify(ress)) != "") {
                    id=(JSON.parse(JSON.stringify(ress[0])).nickname)
                    res.cookie('user',id , {
                        signed: true
                    })
                    res.redirect("/")
                } else {
                    res.redirect("/register#1")
                }
            }
        })
    } catch (err) {
        res.write(err.code)
    }


})
app.post("/signout", (req, res) => {
    if (req.signedCookies.user) {
        res.cookie('user', '', {
            signed: false
        })
        res.send("ok")
    }

})
//funcao registro com upload de image adicionar # para sucesso
app.get("/cplusplus",(req,res) => {
    res.sendFile(__dirname+"/public/theme.html")
})
app.post("/uploadImg", upload.array("img",10), async (req, res) => {
    if (!req.signedCookies.user) {
        res.redirect("/404")
        return
    }
    pathe="["
    delim = req.files.length > 1 ?  "," : ""
    req.files.forEach(x => pathe+= (x.path)+delim)
    res.send(JSON.stringify(pathe+"]"))
})
app.get("/getPost/",(req,res) => {
    type=req.query.st;
    s=req.query.s
    if (type==undefined || s==undefined) {
        res.redirect("/404")
        return
    }
    if(type!="theme"){
        try {

            connection.query('select * from POST where TITLE=?', [s.replace("%20"," ")], (err, ress, fields) => {
                if (err) {
                    console.log(err)
                    res.send(err.code)
                } else {
                    if (JSON.parse(JSON.stringify(ress)) != "") {
                        res.send((JSON.stringify(ress)))
                    } else {
                        console.log(s)
                        res.send("error")
                    }
                }
            })
        } catch (err) {
            res.write(err.code)
        }
    }else{
        try {
            connection.query('select * from POST where THEME=?;', [s], (err, ress, fields) => {
                if (err) {
                    res.write(err.code)
                } else {
                    if (JSON.parse(JSON.stringify(ress)) != "") {
                        res.send((JSON.stringify(ress)))
                    } else {
                        res.send("error")
                    }
                }
            })
        } catch (err) {
            res.write(err.code)
        }
    }
})
app.post("/register", upload.single("img"), async (req, res) => {
    const user = req.body.nick;
    const mail = req.body.email;
    const pwd = req.body.pwd
    const path = typeof req.file == "undefined" ? "" : req.file.path
    returno = "ok"
    if (req.signedCookies.user) {
        res.redirect("/404")
        return
    }
    myid=nid()
    //check name
    try {
        connection.query('select nickname from USUARS where nickname=? OR email=? OR userid=?;', [user, mail,myid], (err, ress, fields) => {
            if (err) {
                res.write(err.code)
            } else {
                if (JSON.parse(JSON.stringify(ress)) != "") {
                    res.redirect("/register#2")
                } else {
                    try {
                        connection.query('INSERT INTO USUARS VALUES (?,?,?,?,?,?);', [
                            user, 
                            mail, 
                            md5(pwd), 
                            path,
                             "",
                            myid], (err, ress, fields) => {
                            if (err) {
                                res.send(err.code)
                                return
                            }

                            connection.commit(function(err) {
                                if (err) {
                                    console.log(err.message);
                                    connection.rollback(function() {});
                                    res.send(err.code)
                                    return
                                }
                            })
                            res.redirect("/")
                        })
                    } catch (err) {
                        res.send(err.code)
                    }
                }
            }
        })
    } catch (err) {
        res.write(err.code)
    }


})
app.use(function(req, res, next) {
    res.status(404).sendFile(__dirname + "/public/404.html")
});
app.listen(3000, function(err) {
    if (err) console.log(err);
    console.log("Server listening on PORT", 3000);
});