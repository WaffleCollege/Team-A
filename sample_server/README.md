# sample_serverをじっくり分析しよう

## 考えてみよう！
Lectureの最後に解説するので、まずは、コードを眺めたり、いじったりして、どんなプログラムなのか推測してみましょう！！推測する力はとっても大事です！


**コメントアウトを使って、気づいたことや考えたこと をどんどんプログラム内に書き残しておきましょう**

※`node.js`のインストールが終わっている人で、実行してみたい場合は、このドキュメントの後半部分を読んでみてください

### 問1

`res.send(...)`という関数は、どんなことをする関数でしょうか？

ex) 37行目: `app.use`関数の第2引数である、関数の中身

### 問2

`res.status(403);`という関数は、どんなことをする関数でしょうか？

### 問3
「4つ目の関数」の中に記載されている`console.log("Start Server!");` は、**コマンドプロンプト(ターミナル)上** と **Chromeのコンソール画面**、どちらに表示されるか？

そして、なぜそこに表示されるのか？


### 問4-1

`app.js`ファイルには、HTMLらしきコードが3種類ある。
- `<h1>Hi! Waffle</h1>`を含むHTML
- `<h1>GO AWAY!</h1>`を含むHTML
- `<h1>Hello  World</h1>`を含むHTML  

なぜ、`http://localhost:8080/`にアクセスすると、`Hello  World`というタイトルのページが表示されるのか。

### 問4-2
では、逆に、以下のHTMLファイルを表示したいときは、どのURLにアクセスすれば良いのでしょうか
- `<h1>Hi! Waffle</h1>`を含むHTML
- `<h1>GO AWAY!</h1>`を含むHTML


### チャレンジ！
実は、画像は5種類用意してますが、なぜか4種類しか表示されません。

このバグを修正してみましょう！

**注意**
コードを書き換えたら、一度サーバを閉じて、再度`node app.js`で再起動してください。

コードを保存しただけでは、変更が適用されません。


## 自分のPCでServerを立ててみよう

### 開発環境の準備

1. [公式サイト](https://nodejs.org/ja/download/)から`node.js`をダウンロードする

1. コマンドプロンプト(Macの場合、ターミナル)で、`node --version`と入力し、エンターを押した時に、バージョンが表示されればOK
    - [Windows](https://www.modis.co.jp/candidate/insight/column_28)
    - [Mac](https://support.apple.com/ja-jp/guide/terminal/apd5265185d-f365-44cb-8b09-71a064a42125/mac)


**参考サイト**
[node.jsをWindowsにインストール](https://qiita.com/taiponrock/items/9001ae194571feb63a5e)


### 必要なファイルの準備

1. [このリンク](https://drive.google.com/file/d/15lUAMPMC4VOr13cciX0vSy68w5BluvMK/view?usp=share_link)にアクセスし、必要なzipファイルをダウンロード

1. `lecture9`という名前のフォルダを作成し、解凍したzipファイルを
まとめて`lecture9`の中に格納する

1. VSCode上で、`lecture9`フォルダを開く

1. `sample_server`フォルダ(解凍したフォルダ)の絶対パスをコピーする
    - おそらく`~~~/lecture9/sample_sever/`という文字列がコピーされる

### コマンドプロンプト(ターミナル)でsample_serverフォルダを開く

1. VSCodeのターミナル画面を開く
    - [参考](https://www.javadrive.jp/vscode/terminal/index1.html)

1. ターミナル上で、以下のコードを実行する。(cdはchange directoryの意味。ファイルを移動する命令)
    >  cd コピーした絶対パス

2. うまくできたか確認しましょう！以下のコマンド実行してください
    - Windowsユーザ
        > dir .
    - Macユーザ
        > ls .
    
    `README.md`や`app.js`が表示されればOK!

### 実行する

1. 必要な外部のファイルをダウンロードするため、以下のコマンドを実行
    > `npm install express`
    (がーっとメッセージが表示されますが、あやしいものじゃないので大丈夫です！また、この時に`node_modules`フォルダ, `package-lock.json`, `package.json`の3つが自動的に追加されます。これがダウンロードがうまくいった証拠)

2. `node app.js` を実行！
    
    -> Server Start! と表示されればOK

3. ブラウザで[http://localhost:8080/](http://localhost.8080/)にアクセス！なにが表示されますか？

4. サーバを閉じたいときは、以下のキーボード操作で強制終了できます
    - Windowsは、コマンドプロントを一度クリックした後、`Ctrl`と`C`を同時に押す
    - Macは、ターミナルを一度クリックした後、`Control`と`C`を同時に押す

### 注意

`node app.js`を実行した際に、エラーが出た時

- エラーの中に、`MODULE_NOT_FOUND`の文字があるとき
    - 原因：必要な外部付ファイルがダウンロードできてない
    - 対処：sample_severフォルダ内にいることを確認した上で、ターミナルで`npm install express`を実行
- エラー文の上から4-6行目あたりに、`Error: listen EADDRINUSE: address already in use :::8080`と書かれている場合
    - 原因：別のターミナルですでに`app.js`が起動している
    - 対処：zipファイルに同封した画像`error_handling.pngを参照`
