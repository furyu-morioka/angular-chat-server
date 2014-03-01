
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 9999);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

server = http.createServer(app); // add
//http.createServer(app).listen(app.get('port'), function(){ // del
server.listen(app.get('port'), function(){ //add
  console.log("Express server listening on port " + app.get('port'));
});


// redis init 
var redis = require('redis');
var store = redis.createClient()
var pub = redis.createClient()
var sub = redis.createClient()

// add start
var socketIO = require('socket.io');
// クライアントの接続を待つ(IPアドレスとポート番号を結びつけます)
var io = socketIO.listen(server);

sub.subscribe("chat");

// クライアントが接続してきたときの処理
io.sockets.on('connection', function(socket) {
  console.log("connection");

  var number = 1;
  var data = {
    text: "Welcome, User " + number,
    user: "User" + number
  };
  io.sockets.emit("message", JSON.stringify(data));

  // メッセージを受けたときの処理
  socket.on('message', function(data) {
    // つながっているクライアント全員に送信
    console.log("message");
    // io.sockets.emit('message', data);
    store.incr("messageNextId", function(e, id){
console.log("hogehoge : " + id);
console.log("data : " + data);
      store.hmset("messages_" + id, {"data":data}, function(e, r){
        pub.publish("chat", "messages_" + id);
      })
    })
  });

  // クライアントが切断したときの処理
  socket.on('disconnect', function(){
    console.log("disconnect");
  });

  sub.on("message", function(pattern, key){
    store.hgetall(key, function(e, obj){
console.log("obj : " + obj.data);
      socket.emit("message", obj.data);
    })
  })


});
// add end


