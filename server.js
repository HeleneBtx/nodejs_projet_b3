let app = require('express')();
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);
let ent = require('ent');
const fs = require('fs');

let port = 3000;

// chargement de la page html 
app.get('/', function (req, res){
    res.sendFile(__dirname + '/index.html');
});

// connection bdd
let mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/gantt', {useUnifiedTopology: true,useNewUrlParser: true,})
.then(() => console.log('DB Connected!'))
.catch(err => {
console.log("database connection error");
});

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  // console.log("database connected");
});

// creation schemas et models
let tasksSchema = new mongoose.Schema();
let tasksModel = mongoose.model('gantt_tasks', tasksSchema);

let linksSchema = new mongoose.Schema();
let linksModel = mongoose.model('gantt_links', linksSchema);

// afficher tout les tasks et links 
tasksModel.find(null, function (err, tasks) {
  if (err) { throw err; }
  // tasks est un tableau de hash
  console.log('tasks :');
  console.log(tasks);
});
linksModel.find(null, function (err, links) {
  if (err) { throw err; }
  // links est un tableau de hash
  console.log('links :');
  console.log(links);
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
