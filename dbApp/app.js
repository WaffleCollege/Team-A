// Express Server インスタンスを作成
const express = require("express");
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const pg = require("pg");
const path = require("path");
const PORT = 3000;
require("dotenv").config({ debug: true });

// POSTで、req.bodyでJSON受け取りを可能に
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);


// テンプレートエンジンの設定
app.set("view engine", "ejs");

// htmlやcssファイルが保存されている publicフォルダ を指定
app.use("/static", express.static(path.join(__dirname, "public")));

// DBに接続
var pool = new pg.Pool({
  database: "postgres",
  user: "postgres", //ユーザー名はデフォルト以外を利用した人は適宜変更すること
  password: "spark1000", //PASSWORDにはPostgreSQLをインストールした際に設定したパスワードを記述。
  host: "localhost",
  port: 5432
});


//user認証の準備OK
app.use(
  session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  if (req.session.userId === undefined) {
    res.locals.username = 'ゲスト';
    res.locals.isLoggedIn = false;
  } else {
    res.locals.username = req.session.username;
    res.locals.isLoggedIn = true;
  }
  next();
});

//登録sign.ejsOK
app.get('/signup', (req, res) => {
  res.render('signup.ejs', { errors: [] });
});

app.post('/signup', 
  (req, res, next) => {
    console.log('入力値の空チェック');
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const errors = [];
    if (username === '') {
      errors.push('ユーザー名が空です');
    }
    if (email === '') {
      errors.push('メールアドレスが空です');
    }
    if (password === '') {
      errors.push('パスワードが空です');
    }
    if (errors.length > 0) {
      res.render('signup.ejs', { errors: errors });
    } else {
      next();
    }
  },
  (req, res, next) => {
    console.log('メールアドレスの重複チェック');
    const email = req.body.email;
    const errors = [];
    var query = {
    text:  'select username, email, password from appusers where email = $1',
    values: [req.body.email]
  };

  pool.connect((err, client) => {
    if (err) {
      console.log(err);
      errors.push('ユーザー登録に失敗しました');
      res.render('signup.ejs', { errors: errors });
    } else {
      client
        .query(query)
        .then(() => {
          next();
        })
        .catch(e => {
          console.error(e.stack);
        });
      }})},
      (req, res) => {
        console.log('ユーザー登録');
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        bcrypt.hash(password, 10, (error, hash) => {
          console.log(username, email, hash);
          var query = {
            text:  'insert into appusers (username, email, password) values ($1,$2,$3)',
            values:  [username, email, hash]
          };
          pool.connect((err, client) => {
            if (err) {
              console.log(err);
              res.redirect("/signup")
              req.session.userId = results.insertId;
              req.session.username = username;
            } else {
              client
                .query(query)
                .then(() => {
                  res.redirect(`/login`);
                })
                .catch(e => {
                  console.error(e.stack);
                });
              }})})},
              );

//ログインlogin.ejsOK
app.get('/login', (req, res) => {
  res.render('login.ejs');
});           

app.post('/login', (req, res) => {
  const email = req.body.email;
  pool.connect((err, client) => {
    if (err) {
      console.log(err);
      res.render('login.ejs', { error: 'ログインに失敗しました' });
    } else {
      client.query(
        'SELECT * FROM appusers WHERE email = $1',
        [email],
        (error, results) => {
          if (results.rows.length > 0) {
            // Define constant plain
            const plain = req.body.password;
            // Define constant hash
            const hash = results.rows[0].password;
            // Add compare method to compare passwords
            bcrypt.compare(plain, hash, (error, isEqual) => {
              if (isEqual) {
                req.session.userId = results.rows[0].id;
                req.session.username = results.rows[0].username;
                res.redirect('/question');
              } else {
                res.redirect('/login');
              }
            });
          } else {
            res.redirect('/login');
          }
        }
      );
    }
  });
});

//スタート画面
app.get("/",(req,res)=>{
  res.render("newstart.ejs")
})
app.post("/start", (req,res)=>{
  res.render("login.ejs")
})

//問題一覧を表示するquestion.ejsok
app.get("/question", (req, res, next) => {
  pool.connect((err, client) => {
    if (err) {
      console.log(err);
    } else {
      client.query( 'select  question_id, question  from contents',
      (error, results)=>{
        console.log(results);
        res.render("question.ejs",{
        questionsResult:results.rows,
        })
})}})}); 

app.get("/screenRecoding", (req,res)=>{
  res.render("screenRecoding.ejs");
})

let appusers_questions_id; 
let questionumber;
//問題を選ぶquestion.ejs(これどうやって問題選ぼう。もう手入力にしました。この辺で通知送りたい。 なんか1しかでない。ok , (postuser_id) req.body.shareurl
app.post('/startpost',(req, res, next) => {
  console.log(req.session.username);
  // console.log(req.session.userId);
  console.log(req.body);
  questionumber = Number(req.body.questionnum);
    var query = {
    text: "insert into appusers_questions (question_id, movieurl) values($1, $2) RETURNING appusers_questions_id",
    values: [questionumber, req.body.shareurl]
  };
  pool.connect((err, client) => {
    if (err) {
      console.log(err);
    } else {
      client.query(query)
        .then(() => {;  //appuserquestion_id image.png 
          res.redirect("/newcode2");
        })
        .catch(e => {
          console.error(e.stack);
        });
}})
});
  // var query = {
  //   text: "insert into up (username,question_id) values($1, $2)",
  //   values: [req.session.username, req.body.questionnum]
  // };
  // pool.connect((err, client) => {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     client.query(query)
  //       .then(() => {  //appuserquestion_id image.png 
  //         res.redirect("/newcode");
  //       })
  //       .catch(e => {
  //         console.error(e.stack);
  //       });
  // }})


//コードの横に出る問題,コメント
app.get("/newcode2", (req, res, next) => {
  console.log(questionumber);
  pool.connect((err, client) => {
    if (err) {
      console.log(err);
    } else {
      client.query( 'select  question ,firstinput, firstoutput, secondinput, secondoutput from contents where question_id = $1',
      [questionumber],
      (error, results)=>{
        console.log(results);
        questionsResult = results.rows[questionumber-1];   
        res.render("newcode2.ejs");
})}})

// pool.connect((err, client) => {
//   if (err) {
//     console.log(err);
//   } else {
//     client.query( " select id from appusers where username = $1 ",
//     [req.session.name],
//     (error, results)=>{
//     console.log(results);
//     postuser_id = results.rows.id;
//   })}})

// pool.connect((err, client) => {
//   if (err) {
//     console.log(err);
//   } else {
//     client.query( 'select fromname, comment from commentfromto where postid = postuser_id',
//     (error, results)=>{
//       console.log(results);
//       commentssResult = results.rows;
//       res.render("newcode.ejs",{
//         questionsResult:questionsResult,
//         commentssResult:commentssResult
//       })
// })}})
}); 

//投稿を並べる
// select a.appusers_questions_id, a.question_id, a.username, a.movieurl, b.question, b.question_id from appusers_questions a left join questions b on a.question_id = b.question_id order by appusers_questions_id DESC;
// let postusername ;
app.get("/show", (req, res, next) => {
  pool.connect((err, client) => {
    if (err) {
      console.log(err);
    } else {
      client.query( "select a.appusers_questions_id, a.question_id, a.username, a.movieurl, b.question, b.question_id from appusers_questions a left join contents b on a.question_id = b.question_id order by appusers_questions_id DESC ;",
      (error, results)=>{
      console.log(results);
      // postusername = results.rows.username;
      // postquestion = results.rows.question;
      res.render("show.ejs",{
      LivepostsResult:results.rows
      })
})}})});

//（INSERT）投稿を見る画面においてユーザーBが入力した投稿番号という変数req.body.postnumをコメントデータベースに保存する。
app.post("/postselect", (req,res)=>{
  console.log(req.body);
    var query = {
    text : 'insert into commentfromto (postid) values ($1) ',
    values : [req.body.postnum]
  };
  pool.connect((err, client) => {
    if (err) {
    } else {
      client
        .query(query)
        .then(() => {
          res.render("chat.ejs");
        })
        .catch(e => {
          console.error(e.stack);
        });
  }})
});

// app.get("/comment",(req,res)=>{
//   let postuserid;
//   let postquestionid;
//   // req.body.transcription
//   //選んだ投稿の宛名と問題文が見れる
//   pool.connect((err, client) => {
//     if (err) {
//       console.log(err);
//     } else {
//       client.query( " SELECT a.postuser_id, a.question_id FROM appusers_questions a JOIN commentfromto c ON a.appusers_questions_id = c.postid ",
//       (error, results)=>{
//       console.log(results);
//       postuserid = results.rows.a.postuser_id;
//       postquestionid = results.rows.a.question_id;
//     })}})
        
//   let postuser_name;
//   let post_question;
//   pool.connect((err, client) => {
//       if (err) {
//         console.log(err);
//       } else {
//         client.query( " select username from appusers where id = $1 ",
//         [postuserid],
//         (error, results)=>{
//         console.log(results);
//         postuser_name = results.rows.username;
//       })}})
  
//       pool.connect((err, client) => {
//         if (err) {
//           console.log(err);
//         } else {
//           client.query( " select question from contents where question_id = $1",
//           [postquestionid],
//           (error, results)=>{
//           console.log(results);
//           post_question = results.rows.question;
//           res.render("chat.ejs" ,{
//             postuser_name : postuser_name,
//             post_question : post_question
//           })
//         })}})
//       }); 
//コメントをする

app.post("/commented",(req,res)=>{
  console.log(req.body);
    var query = {
    text : 'insert into commentstofrom (fromname, comment) values ($1, $2) ',
    values : [req.session.name, req.body.comment]
  };
  pool.connect((err, client) => {
    if (err) {
    } else {
      client
        .query(query)
        .then(() => {
          res.redirect("/comment");
        })
        .catch(e => {
          console.error(e.stack);
        });
  }})});
  

//サーバー立ち上げ
app.listen(PORT, function(err) {
  if (err) console.log(err);
  console.log("Start Server!");
});


// //コードを保存する
// app.post("/save",(req,res)=>{
//    let code = editorvalue;
//    console.log(req.body);
//    var query = {
//    text : 'insert into appusers_questions (codes) values ($1) where id = $2',
//    values : [editorvalue, appusers_questions_id]
//  };
//  pool.connect((err, client) => {
//    if (err) {
//      console.log(err);
//    } else {
//      client
//        .query(query)
//        .then(() => {
//          res.redirect("/question");
//        })
//        .catch(e => {
//          console.error(e.stack);
//        });
//  }})});


//音声とノートを終了時に投稿する 
// app.post("/savetext",(req,res)=>{
//   // req.body.transcription
//   console.log(req.body);
//     var query = {
//     text : 'insert into appusers_questions (transcription, codes, note) values ($1, $2) where id = $4',
//     values : [req.body.transcription, req.body.note, appusers_questions_id]
//   };
//   pool.connect((err, client) => {
//     if (err) {
//       console.log(err);
//     } else {
//       client
//         .query(query)
//         .then(() => {
//           res.redirect("/show");
//         })
//         .catch(e => {
//           console.error(e.stack);
//         });
//   }})});



//投稿一覧を表示するshow.ejs
// app.get("/show", (req, res, next) => {
//   pool.connect((err, client) => {
//     if (err) {
//       console.log(err);
//     } else {
//       client.query( "select question_id, postuser_id, shareurl from appusers_questions where transcription is null  ORDER BY appusers_questions_id DESC",
//       (error, results)=>{
//       console.log(results);
//       res.render("show.ejs",{
//       LivepostsResult:results.rows
//       })
// })}})
//   pool.connect((err, client) => {
//     if (err) {
//       console.log(err);
//     } else {
//       client.query( "select question_id, postuser_id, transcription, codes from appusers_questions where transcription is not null  ORDER BY appusers_questions_id DESC",
//       (error, results)=>{
//         console.log(results);
//         res.render("show.ejs",{
//         FinishedpostsResult:results.rows
//         })
// })}})
// });

// //コメント画面に飛ぶ
// app.get('/new',(req,res)=>{
//   res.render('new.ejs');
// })

// //投稿を選んでコメントを書き込
// let comment;
// app.post('/comment',(req, res, next) => {
//   comment = req.body.comment;//このidに宛名の投稿のnameタグが入るのでもしつくったら入れたい！
//   console.log(req.body);
//     var query = {
//     text: "insert into commenttexts (appusers_questions_id,commenter_id, codecomment, comment) values($1, $2, $3)",
//     values: [appusers_questions_id, req.session.id, req.body.codecomment, req.body.comment]
//   };
//   pool.connect((err, client) => {
//     if (err) {
//       console.log(err);
//     } else {
//       client
//         .query(query)
//         .then(() => {
//           res.redirect("/show");
//         })
//         .catch(e => {
//           console.error(e.stack);
//         });
//   }})});




// app.get("/execute", async (req, res) => {
//   // judge0 APIを呼び出す
//   //  => 受け取ったコード(editorValue)を入れる
//   //まずトークンを呼ぶpost
//   function tokengiven(){
 
  



 

  //"judge0を呼びだした結果" 
  // ボールをwrite.ejsに返す ; 


 



// app.post("/compile", (req, res) => {
// const fetch = require('node-fetch');
//  // {"language_id":52,"source_code":btoa(editorValue),"stdin":"stdin"};
//"SnVkZ2Uw"
//   const url = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&fields=*';
  
//   const options = {
//     method: 'POST',
//     headers: {
//       'content-type': 'application/json',
//       'Content-Type': 'application/json',
//       'X-RapidAPI-Key': 'secret',
//       'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
//     },
//     body: JSON.stringify({"language_id":52,"source_code":code,"stdin":"SnVkZ2Uw"})
//   };
  
//   fetch(url, options)
//     .then(res => res.json())
//     .then(json => {
//       console.log(json);

//       if (!json.token) {
//         throw new Error('Token not found in network response');
//       }

//       const token = json.token;
//       let submissionStatus = 'Processing';
  
//       const checkStatus = () => {
//         return fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
//           headers: {
//             'X-RapidAPI-Key': '71aec70437mshf7a8d2deedb33f1p185b10jsn924da6036e40' // Replace this with your own API key
//           }
//         })
//         .then(response => {
//           if (!response.ok) {
//             throw new Error('Network response was not ok');
//           }
//           return response.json();
//         })
//         .then(data => {
//           if (!data.status) {
//             throw new Error('Status not found in network response');
//           }
  
//           submissionStatus = data.status.description;
  
//           if (submissionStatus !== 'Completed') {
//             return new Promise(resolve => {
//               setTimeout(resolve, 1000);
//             })
//             .then(() => {
//               return checkStatus();
//             });
//           } else {
//             return data;
//           }
//         });
//       };
  
//       return checkStatus();
//     })
//     .then(submissionDetails => {
//       const final = submissionDetails.stdout;
//       console.log(final);
//       res.render('show.ejs',{final:final});
//     })
//     .catch(error => {
//       console.error(error);
//       res.status(500).send('An error occurred');
//     });
// });

// //https://judge0-ce.p.rapidapi.com/submissions
//   fetch('https://judge0-ce.p.rapidapi.com/submissions', {
//     method: 'POST',
//     params: {base64_encoded: 'true', fields: '*'},
//     headers: {
//       'content-type': 'application/json',
//       'Content-Type': 'application/json',
//       'X-RapidAPI-Key': '71aec70437mshf7a8d2deedb33f1p185b10jsn924da6036e40',
//       'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
//     },
//     data: JSON.stringify({
//       source_code: code,
//       language_id: 71, // Change this to the desired language ID
//       stdin: '', // Provide input as needed
//       expected_output: '', // Provide expected output as needed
//       cpu_time_limit: 2, // Change this to the desired CPU time limit in seconds
//       language_code: 'python' // Change this to the desired language code

//     })


   



// const bodyParser = require('body-parser');
// const axios = require('axios');

// app.use(bodyParser.json());
// let editorValue = '';
// app.post("/compile", async (req, res) => {
//   console.log(editorValue);
//   const code = editorValue;

//   try {
//     const response = await axios.post('https://judge0-ce.p.rapidapi.com/submissions', {
//       source_code: code,
//       language_id: 71, // Change this to the desired language ID
//       stdin: '', // Provide input as needed
//       expected_output: '', // Provide expected output as needed
//       cpu_time_limit: 2, // Change this to the desired CPU time limit in seconds
//       language_code: 'python' // Change this to the desired language code
//     }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'X-RapidAPI-Key': '71aec70437mshf7a8d2deedb33f1p185b10jsn924da6036e40'
//       }
//     });

//     if (!response.data.token) {
//       throw new Error('Network response was not ok');
//     }

//     const token = response.data.token;
//     let submissionStatus = 'Processing';

//     const checkStatus = async () => {
//       const statusResponse = await axios.get(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
//         headers: {
//           'X-RapidAPI-Key': '71aec70437mshf7a8d2deedb33f1p185b10jsn924da6036e40' // Replace this with your own API key
//         }
//       });

//       if (!statusResponse.data.status) {
//         throw new Error('Network response was not ok');
//       }

//       submissionStatus = statusResponse.data.status.description;

//       if (submissionStatus !== 'Completed') {
//         await new Promise(resolve => {
//           setTimeout(resolve, 1000);
//         });
//         return checkStatus();
//       } else {
//         return statusResponse.data;
//       }
//     };

//     const submissionDetails = await checkStatus();
//     const final = submissionDetails.stdout;
//     console.log(final);
//     res.render('show.ejs',{final:final})
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('An error occurred');
//   }
// });
    // pool.query(
      // 'SELECT username, email, password FROM test_schema.user_table WHERE email = ?',
      // [email],
    //   (error, results) => {
    //     console.log(results);
    //     if (results !== []) {
    //       errors.push('ユーザー登録に失敗しました');
    //       res.render('signup.ejs', { errors: errors });
    //     } else {
    //       next();
    //     }
    //   }
    // );
 

  //     pool.query(
  //       'INSERT INTO test_schema.user_table (username, email, password) VALUES (?, ?, ?)',
  //       [username, email, hash],
  //       (error, results) => {
  //         req.session.userId = results.insertId;
  //         req.session.username = username;
  //         res.redirect('/');
  //       }
  //     );
  //   });
  // }




//   pool.query(
//     'SELECT * FROM test_schema.user_table WHERE email = ?',
//     [email],
//     (error, results) => {
//       console.log(results);
//       if (results !== []) {
//         // 定数plainを定義してください
//         const plain = req.body.password;
        
//         // 定数hashを定義してください
//         const hash = results[0].password;
        
//         // パスワードを比較するためのcompareメソッドを追加してください
//         bcrypt.compare(plain, hash, (error,isEqual) =>{
//           if(isEqual){
//             req.session.userId = results[0].id;
//             req.session.username = results[0].username;
//             res.redirect('/');
//           }else{
//             res.redirect("/login");
//           }
//         })
//       } else {
//         res.redirect('/login');
//       }
//     }
//   );
// });

// app.listen(PORT, function(err) {
//   if (err) console.log(err);
//   console.log("Start Server!");
// });

// app.get('/logout', (req, res) => {
//   req.session.destroy((error) => {
//     res.redirect('/');
//   });
// });

//ユーザー認証 auth0
  // const {auth, requiresAuth} = require('express-openid-connect')

  // if (require.main === module) {
  //   main()
  // }
  
  // async function main () {
  //   try {
  //       app.use(auth({ // <1>
  //       authRequired: false,
  //       auth0Logout: true,
  //       secret: process.env.AUTH0_SECRET,
  //       baseURL: process.env.AUTH0_BASE_URL,
  //       clientID: process.env.AUTH0_CLIENT_ID,
  //       issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  //     }))
  
  //       app.get('/', (req, res) => { // <2>
  //       res.send({isPrivate: false})
  //     })
  
  //       app.use('/private/', requiresAuth()) // <3>
  
  //       app.get('/private/', (req, res) => { // <4>
  //       res.send({isPrivate: true, sub: req.oidc.user.sub}) // <5>
  //     })
  
  //       app.listen(process.env.PORT, () => { // <6>
  //       console.info(`Listening on ${process.env.PORT}`)
  //     })
  //   } catch (err) {
  //     console.error(err)
  //   }
  // }

  // app.post("/update", (req, res, next) => {
  //   console.log(req.body);
  //     var query = {
  //     text:
  //       "update test_schema.re_test_table set price=340 where id=' ';"
  //       "INSERT INTO  (question, answer) VALUES($1, $2)",
  //       values: [req.body.question,req.body.answer]
  //   };
  
    // pool.connect((err, client) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     client
    //       .query(query)
    //       .then(() => {
    //         res.redirect("/show");
    //       })
    //       .catch(e => {
    //         console.error(e.stack);
    //       });
    // }})});


  
  

// app.get("/", (req, res, next) => {
//   // データベースからデータを読み込む
//   pool.connect((err, client) => {
//     if (err) {
//       console.log(err);
//     } else {
//       // query関数の第一引数にSQL文をかく
//       client.query("SELECT name FROM goya",
//        (err, result) => {
//         res.render("index", {
//           title: "Express",
//           name: result.rows[0].name
//         });

//         //コンソール上での確認用
//         console.log(result);
//       });
//     }
//   });
// });



  // console.log(req.body);
  // (Challenge)すでにDBにあるコメントを表示
  // pool.connect((err, client) => {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     // query関数の第一引数にSQL文をかく
  //     client.query("SELECT name FROM users",
  //      (err, result) => {
  //     res.render("showComments.ejs", {
  //     title: "Express",
  //     name: result.rows[0].name
  //     })})};
