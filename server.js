let app = require('express')();
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);
let ent = require('ent');
const fs = require('fs');

// let bodyParser = require('body-parser');
// let path = require('path');

let port = 3000;

//Chargement de la page html 
app.get('/', function (req, res){
    res.sendFile(__dirname + '/index.html');
});

// connection au serveur central 
const socket = require('socket.io-client');
let client = socket.connect('http://51.15.137.122:18000/', {reconnect: true});

client.on('connect', () => {
  console.log('connected')

  client.emit('needHelp');
  //console.log(client.emit('needHelp'));
});

server.listen(port, function(){
  console.log("Server is running on port "+port+"...");
});
