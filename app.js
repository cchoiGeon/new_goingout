//기본 세팅
const express = require('express');
const ejs = require('ejs');
const mysql = require('mysql');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const server = express();
const multer = require("multer");
const path = require("path");

// 모듈 불러오기
const alphlist = ['A','B','C','D','E','F','G','H','I','J','K','L','M'];

// db 설정
const db = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '11111111',
  database : 'going_out'
});
db.connect();
//MULTER 사용
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,'./uploads') // cb 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null,path.basename(file.originalname,ext) + "-" + Date.now() + ext); // cb 콜백함수를 통해 전송된 파일 이름 설정
  },
})
const upload = multer({storage: storage})

//set 메서드
server.set('view engine', 'ejs');
server.set('views', './views');

//use 메서드
server.use(express.static('assets'));

server.use(bodyParser.urlencoded({ extended: false}));
server.use(session({
  secret: 'q1321weff@45%$',
  resave: false,
  saveUninitialized: true,
  store: new FileStore()
}))


// 홈페이지
server.get('/', (req, res) => {
  if(req.session.login){
    let logintrue = `
    <li><a class="nav-link scrollto" href="/mypage">mypage</a></li></li>
    <li><a class="nav-link scrollto" href="/logout_process">logout</a></li></li>
    `
    return res.render('index',{'logintrue':logintrue})
  }
  let logintrue = `<li><a class="getstarted scrollto" href="/login">Get Started</a></li>`
  return res.render('index',{'logintrue':logintrue})
});



server.get('/mypage',(req,res) => {
  db.query('SELECT * FROM register WHERE id=?',[req.session.userid],function(err,register){
    let match_status = register[0].match_status
    if(match_status){
      db.query('SELECT * FROM submituser WHERE user_id=?',[req.session.userid],function(err2,result){
        let match_user = result[0].match_user
        return res.render('mypage',{'match_status':match_status,'match_user':match_user})
      })
    }else{
      return res.render('mypage',{'match_status':'매칭 중','match_user':''})
    }
  })
})










//회원가입 기능
server.get('/register', (req, res) => {
  res.render('register');
})
server.post("/register_process",(req,res) =>{
  let post = req.body
  let contact = post.selectcontact;
  let sex = post.sex
  if(contact === "NULL" || sex === "NULL"){
    res.write("<script>alert('Please check contact or sex.')</script>");
    return res.write("<script>window.location='/register'</script>");
  }
  db.query('SELECT * FROM register',function(err2,result){
    for(let i = 0; i < result.length; i++){
      if(result[i].id == post.id){
        res.write("<script>alert('This ID is already in use.')</script>");
        return res.write("<script>window.location='/register'</script>");;
      }
    }
    if(9<post.id.length<=10 && post.password.length>10){
      db.query('INSERT INTO register(id,password,sex,age,selectcontact,contact)VALUES(?,?,?,?,?,?)', // register table에 유저 아이디,비밀번호,성별,이름,연락방법,연락처 올림
        [post.id,post.password,post.sex,post.age,post.selectcontact,post.contact],
        function(err3,end){
          req.session.registerId = parseInt(post.id);
          req.session.save(function(){
            return res.redirect('/register2_A');
          });
      });
    }else{
      res.write("<script>alert('Please check id length or password length')</script>");
      return res.write("<script>window.location='/register'</script>");;
    }
  });
});

for(let alph in alphlist){
  server.get(`/register2_${alphlist[alph]}`,(req,res) =>{
    if(!req.session.registerId){
      return res.redirect('/register')
    }
    let campuslist = `
    <tbody>
      <tr>
        <th>
          <input id="searchcampus2"type="text"><button type="button" onclick="searchcampus()">학교 찾기</button>
        </th>
      </tr>
      <tr>
        <th colspan="2">
            <a href="/register2_A"><button type="button">ㄱ</button></a>
            <a href="/register2_B"><button type="button">ㄴ</button></a>
            <a href="/register2_C"><button type="button">ㄷ</button></a>
            <a href="/register2_D"><button type="button">ㄹ</button></a>
            <a href="/register2_E"><button type="button">ㅁ</button></a>
            <a href="/register2_F"><button type="button">ㅂ</button></a>
            <a href="/register2_G"><button type="button">ㅅ</button></a>
            <a href="/register2_H"><button type="button">ㅇ</button></a>
            <a href="/register2_I"><button type="button">ㅈ</button></a>
            <a href="/register2_J"><button type="button">ㅊ</button></a>
            <a href="/register2_K"><button type="button">ㅋ</button></a>
            <a href="/register2_L"><button type="button">ㅍ</button></a>
            <a href="/register2_M"><button type="button">ㅎ</button></a>
        </th>
      </tr>
    `
    const korcampus= require(`./korcampus/korcampus${alphlist[alph]}`)
    korcampus.forEach(function(korcampus){
        campuslist += `
        <tr> 
          <td colspan="2"><input type="submit" name ="selectcampus" id="${korcampus}" value="${korcampus}"></td>
        </tr>
        `
    });
    campuslist+= `</tbody>`
    res.render('register2',{'campuslist':campuslist})
    });
}


server.post("/register2_process",(req,res)=>{
  let post = req.body;
  let selectcampus = post.selectcampus;
  if(selectcampus ==='err'|| selectcampus === undefined){
    res.write(`<script>alert('plase check campus')</script>`);
    return res.write("<script>window.location='/register2'</script>");
  }
  db.query("UPDATE register SET campus=? WHERE id=?",[selectcampus,req.session.registerId],function(err,result){ // register table에 유저 학교 업데이트해줌
    return res.redirect("/register3");
  });
});


server.get('/register3', (req, res) => {
  if(!req.session.registerId){
    return res.redirect('/register')
  }
  res.render('register3');
})
server.post('/register3_process',upload.single('card'),(req,res) => {
  if(!req.file){
    res.write(`<script>alert('plase upload student card')</script>`);
    return res.write("<script>window.location='/register3'</script>");
  }
  db.query('UPDATE register SET student_card_root=? WHERE id=?',[req.file.filename,req.session.registerId],function(err,result){ // register table에 유저 학생증 업데이트해줌
    console.log(req.file.filename,req.session.registerId)
    return res.redirect('/register4');
  })
});

server.get('/register4', (req, res) => {
  if(!req.session.registerId){
    return res.redirect('/register')
  }
  res.render('register4');
})
server.post("/register4_process",(req,res)=>{
  let post = req.body;
  let selectmatch = post.selectmatch;
  let selectsex = post.selectsex;
  let close = post.close;
  let ok = post.ok;
  if(close){
    res.redirect('/register4');
    return false;
  }
  if(selectmatch === '매칭 종류 정하기' || selectsex ==="상대방 성별 정하기"){
    res.write("<script>alert('Please re-enter it.')</script>");
    return res.write("<script>window.location='/register4'</script>");
  }
  if(ok){
    db.query('UPDATE register SET selectmatch=?,selectsex=? WHERE id=?',[selectmatch,selectsex,req.session.registerId],function(err2,result){
      return res.redirect('/makematch')
    });
  }
});

server.get("/makematch",(req,res)=>{
  db.query('SELECT * FROM register',function(err,register){
    for(let i=0; i<register.length; i++){
      if(register[i].id === req.session.registerId){
        db.query('INSERT INTO submituser(user_id,user_sex,user_age,user_campus,user_selectcontact,user_contact,user_selectmatch,user_selectsex) VALUES(?,?,?,?,?,?,?,?)',[register[i].id,register[i].sex,register[i].age,register[i].campus,register[i].selectcontact,register[i].contact,register[i].selectmatch,register[i].selectsex],function(err,result){ 
          req.session.userid = register[i].id
          req.session.login = true;
          req.session.save(function(){
            res.write("<script>alert('Submission complete!')</script>");
            return res.write("<script>window.location='/mypage'</script>");
          });
          return false;
        });
      }
    }
  });
});

//로그인 기능
server.get('/login', (req, res) => {
  res.render('login');
})
server.post("/login/process",(req,res) =>{
  let post = req.body
  db.query('SELECT * FROM register',function(err,result){
    if(err){
      res.redirect('/login');
      return false;
    }
    for(let i = 0; i < result.length; i++){
      if(result[i].id === parseInt(post.id) && result[i].password === post.password){
        req.session.userid = result[i].id;
        req.session.login = true;
        req.session.save(function(){
          res.write(`<script>alert('Hi ${result[i].id} !')</script>`);
          return res.write("<script>window.location='/'</script>");
        });
        return false;
      }
    }
    res.write("<script>alert('Please check id or password')</script>");
    return res.write("<script>window.location='/login'</script>");;
  });
});

server.get("/logout_process",(req,res) => {
  req.session.destroy(function(err){
    return res.redirect('/');
  })
});

server.listen(3000);