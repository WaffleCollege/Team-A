// Express Server インスタンスを作成
let express = require("express");
let app = express();

// ポートフォリオが保存されている toppageフォルダ を指定
app.use("/", express.static("ログイン画面"));

const path = require("path");
const { allowedNodeEnvironmentFlags } = require("process");

app.use("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../","sample_server", "product", "ログイン画面","login.html"))  
    });

app.use(express.static('link'))

app.get('/', (req, res) => {
  res.render('login.html');
});
  

function addImg(img) {
   if (typeof img === "string"){
    let imgElement = document.createEkement("img");
    imgElement.src = img;
    document.body.appendChild(imgElement)
  } else {
    document.body.appendChild(img);
  }
}

// fetch("https://www.jma.go.jp/bosai/forecast/data/forecast/130000.json")
// .then(res => {
//      return res.json();
// })
// .then ((data) => {
//     console.log (data[0].timeSeries[0].areas[0].weathers);
//     return (data[0].timeSeries[0].areas[0].weathers);
    
// });

// 4つ目の関数
app.listen(3030, () => {
    console.log("Start Server!");
})

//http://localhost:3030/ でサーバー確認