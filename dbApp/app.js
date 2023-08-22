// Express Server インスタンスを作成
// node.jsはnpmというコマンドを使って今回使いたいモジュールを入れていきます。
// 例）npm install ~
// インストールしたものを最初に定義する必要があります。

const express = require("express");
const app = express();
const session = require('express-session');
const bcryptjs = require('bcryptjs');
const pg = require("pg");
const path = require("path");
const PORT = 3000;
require("dotenv").config({ debug: true });

// POSTで、req.bodyでJSON受け取りを可能に
// 一言で言うと、一般的なjavascriptのオブジェクトをJSON形式のデータに変換する感じみたいです。
// 2017年まではbody-perserというnpmモジュールをimportしていましたが、今はその必要がなくなったそう。

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

// 今回のpostgreSQLの接続情報
var pool = new pg.Pool({
  database: "teama",
  user: "teama", 
  password: "teama", //
  host: "localhost", //デプロイしたらここが変わります
  port: 5432        //postgreSQLはport番号は5432でほぼ固定
});


//////////ユーザーのパスワード認証////////////

//user認証（ここは過去にprogateのnode.jsを真似てやったもののままです、すごくそのままなので説明を省いています。）
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

//登録画面sign.ejs
app.get('/signup', (req, res) => {
  res.render('August_signup.ejs', { errors: [] });
});

app.post('/signup', 
    // 1. Check for empty input fields
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
            return res.render('August_signup.ejs', { errors: errors });
        } 
        next();
    },
  
    // 2. Check for email duplication
    (req, res, next) => {
        console.log('メールアドレスの重複チェック');
        const email = req.body.email;
        const errors = [];

        var query = {
            text: 'select email from users where email = $1',
            values: [email]
        };

        pool.connect((err, client) => {
            if (err) {
                console.log(err);
                errors.push('データベースエラー');
                return res.render('August_signup.ejs', { errors: errors });
            } 

            client.query(query)
                .then(result => {
                    if (result.rows.length > 0) {
                        errors.push('メールアドレスは既に使用されています'); // 'Email already in use'
                        return res.render('August_signup.ejs', { errors: errors });
                    } 
                    next();
                })
                .catch(e => {
                    console.error(e.stack);
                    if (!res.headersSent) {
                        errors.push('データベースエラー');
                        return res.render('August_signup.ejs', { errors: errors });
                    }
                });
        });
    },
  
    // 3. Register the user
    (req, res) => {
        console.log('ユーザー登録');
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        
        bcryptjs.hash(password, 10, (error, hash) => {
            if (error) {
                console.log(error);
                return res.redirect("/signup");
            }
            
            console.log(username, email, hash);
            
            var query = {
                text:  'insert into users (username, email, password) values ($1,$2,$3)',
                values:  [username, email, hash]
            };
            
            pool.connect((err, client) => {
                if (err) {
                    console.log(err);
                    return res.redirect("/signup");
                } 
                client
                    .query(query)
                    .then(() => {
                        res.redirect(`/login`);
                    })
                    .catch(e => {
                        console.error(e.stack);
                        if (!res.headersSent) {
                            return res.redirect("/signup");
                        }
                    });
            });
        });
    }
);


//ログイン
app.get('/login', (req, res) => {
  res.render('August_login.ejs');
});           

//ちなみにこんなふうに同じ「/login」というエンドポイントに対して
//get,postなどの複数のHTTPメソッドを使用することを
//RESTFULなAPIと言ったりとか

app.post('/login', (req, res) => {
  const email = req.body.email;
  pool.connect((err, client) => {
    if (err) {
      console.log(err);
      res.render('August_login.ejs', { error: 'ログインに失敗しました' });
    } else {
      client.query(
        'SELECT * FROM users WHERE email = $1',
        [email],
        (error, results) => {
          if (results.rows.length > 0) {
            // Define constant plain
            const plain = req.body.password;
            // Define constant hash
            const hash = results.rows[0].password;
            // Add compare method to compare passwords
            bcryptjs.compare(plain, hash, (error, isEqual) => {
              if (isEqual) {
                req.session.userId = results.rows[0].user_id;
                req.session.username = results.rows[0].username;
                res.redirect('/start');
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

/////////////問題投稿機能//////////////
//今回、大きく作り替えた点としては、問題番号と回答番号をsessionとして保持するという点です。

//スタート画面表示
app.get("/start",(req,res)=>{
  res.render("August_start.ejs")
})

/////////問題を投稿//////////
app.post("/postQuestion",(req,res)=>{
    var query = {
    text : 'insert into questions (user_id, question_content, creation_date ) values ($1, $2, $3) ',
    values : [req.session.userId, req.body.question_content, req.body.creation_date]
  };
  pool.connect((err, client) => {
    if (err) {
    } else {
      client
        .query(query)
        .then(() => {
          res.redirect("/question");
        })
        .catch(e => {
          console.error(e.stack);
        });
  }})});

///////問題一覧を表示/////////
app.get("/question", (req, res, next) => {
  pool.connect((err, client) => {
    if (err) {
      console.log(err);
    } else {
      client.query( 'select question_id, question_content from questions',
      (error, results)=>{
        console.log(results);
        res.render("August_question.ejs",{
        questionsResult:results.rows,
        })
})}})}); 

////////////問題を選択/////////////
//////////ここで問題番号と回答番号をグローバル変数にしておくという必要がなくなる///////////
//let questionNumber;
//let answerNumber;

app.post('/selectQuestion/:number', (req, res) => {
  console.log(req.session.userId);
  
  // パラメータから問題番号を取得
  const questionNumber = Number(req.params.number);

  // 問題番号をsessionに保存
  req.session.questionNumber = questionNumber;

  const answerQuestion = {
    text: "insert into answers (question_id, user_id) values($1, $2) RETURNING answer_id",
    values: [questionNumber, req.session.userId]
  };

  pool.connect((err, client) => {
    if (err) {
      console.log(err);
      res.status(500).send("Database Connection Error");
      return;
    }

    client.query(answerQuestion, (error, result) => {
      if (error) {
        console.log(error);
        res.status(500).send("Query Error");
        return;
      }

      // 回答番号をsessionに保存
      req.session.answerNumber = result.rows[0].answer_id;
      res.redirect("/code");
    });
  });
});

///////////////解いている時の問題表示//////////////////


app.get("/code", (req, res) => {  
  pool.connect((err, client) => {
    if (err) {
      console.log(err);
      res.status(500).send("Database Connection Error");
      return;
    }

    const query = 'select question_content from questions where question_id = $1';
    client.query(query, [req.session.questionNumber], (error, results) => {
      if (error) {
        console.log(error);
        res.status(500).send("Query Error");
        return;
      }

      if (results.rows.length === 0) {
        res.status(404).send("Question not found.");
        return;
      }

      res.render("August_code.ejs", { question: results.rows[0].question_content });
    });
  });
});


///////////解いたコードを保存////////////
app.post("/postAnswer", (req, res, next) => {
  let code = req.body.editorvalue;
  
  var updateAnswer = {
      text: 'UPDATE answers SET answer_content = $1 WHERE user_id = $2 AND answer_id = $3',
      values: [code, req.session.userId, req.session.answerNumber]
  };
  
  pool.connect((err, client) => {
      if (err) {
          console.log(err);
          res.status(500).send("Database Connection Error");
          return;
      }

      client.query(updateAnswer)
          .then(() => {
              res.redirect("/question");
          })
          .catch(e => {
              console.error(e.stack);
              res.status(500).send("Query Execution Error");
          });
  });
});

/////////////投稿一覧を表示///////////////////
app.get("/show", (req, res, next) => {
  pool.connect((err, client, done) => {
    if (err) {
      console.log(err);
      res.status(500).send("Database Connection Error");
      return;
    }
    const query = `
      SELECT a.answer_id, a.answer_content, q.question_content, u.username
      FROM answers a
      JOIN users u ON a.user_id = u.user_id
      JOIN questions q ON a.question_id = q.question_id
      ORDER BY a.answer_id
    `;

    client.query(query, (error, results) => {
      done();  // release the client to the pool

      if (error) {
        console.log(error);
        res.status(500).send("Query Error");
        return;
      }
      if (results.rows.length === 0) {
        res.status(404).send("No answers found.");
        return;
      }
      res.render("August_show.ejs", { posts: results.rows });
    });
  });
});


///////show.ejs（投稿一覧）の中で選択した問題がpostIDとして指定できている//////

///////////////////コメントを見る///////////////////////
app.get("/comments/:postId", (req, res) => {
  const postId = req.params.postId;
  
  pool.connect((err, client, done) => {
    if (err) {
      console.log(err);
      res.status(500).send("Database Connection Error");
      return;
    }

    const Questquery = `
      SELECT a.answer_id, a.answer_content, q.question_content, u.username
      FROM answers a
      JOIN users u ON a.user_id = u.user_id
      JOIN questions q ON a.question_id = q.question_id
      WHERE a.answer_id = $1
    `;

    const commentquery = 'SELECT comment_content FROM comments WHERE answer_id = $1';

    client.query(Questquery, [postId], (error, result) => {
      if (error) {
        done();  
        console.log(error);
        res.status(500).send("Query Error");
        return;
      }
      
      if (result.rows.length === 0) {
        done(); 
        res.status(404).send("No answers found.");
        return;
      }

      const post = result.rows[0];

      client.query(commentquery, [postId], (commentError, commentResult) => {
        done(); 
        
        if (commentError) {
          console.log(commentError);
          res.status(500).send("Query Error");
          return;
        }

        const comments = commentResult.rows;
        res.render("August_comment.ejs", { post: post, comments: comments });
      });
    });
  });
});


///////////////////コメントをする///////////////////////
app.post("/comments/:postId", (req, res) => {
  const postId = req.params.postId;
  const comment = req.body.comment;

  // 1. answers データベースから userID と answerID を取得
  const getAnswerQuery = `
    SELECT user_id, answer_id 
    FROM answers 
    WHERE answer_id = $1
  `;

  pool.connect((err, client, done) => {
    if (err) {
      console.log(err);
      res.status(500).send("Database Connection Error");
      return;
    }

    client.query(getAnswerQuery, [postId], (error, result) => {
      done();

      if (error) {
        console.log(error);
        res.status(500).send("Query Error");
        return;
      }

      if (result.rows.length === 0) {
        res.status(404).send("Answer not found.");
        return;
      }

      const answer = result.rows[0];

      // 2. 取得した情報とリクエストからのコメント内容を用いて、comments データベースにデータを保存
      const insertCommentQuery = {
        text: "INSERT INTO comments (from_user_id, to_user_id, answer_id, comment_content) VALUES ($1, $2, $3, $4)",
        values: [req.session.userId, answer.user_id, answer.answer_id, comment]
      };

      client.query(insertCommentQuery, (insertError) => {
        if (insertError) {
          console.log(insertError);
          res.status(500).send("Error inserting comment.");
          return;
        }

        res.redirect("/comments/" + postId);
      });
    });
  });
});

//サーバー立ち上げ
app.listen(PORT, function(err) {
  if (err) console.log(err);
  console.log("Start Server!");
});

