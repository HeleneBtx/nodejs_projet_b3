// let app = require('express')();
let express = require('express');
let server = require('http').createServer(express);
let io = require('socket.io').listen(server);
let ent = require('ent');
const fs = require('fs');

let bodyParser = require('body-parser');
let path = require('path');

let port = 3000;
let app = express();

// chargement de la page html  
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));


// app.get('/', function (req, res){
//     res.sendFile(__dirname + '/index.html');
// });

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

let tasksSchema = new mongoose.Schema({
  id : Number,
  text : String,
  start_date : String,
  duration : Number,
  parent : Number
});

// let tasksSchema = new mongoose.Schema();
let tasksModel = mongoose.model('gantt_tasks', tasksSchema);

let linksSchema = new mongoose.Schema();
let linksModel = mongoose.model('gantt_links', linksSchema);


// afficher tout les tasks et links 
// tasksModel.find(null, function (err, tasks) {
//   if (err) { throw err; }
//   // tasks est un tableau de hash
//   console.log('tasks :');
//   console.log(tasks);
// });

// linksModel.find(null, function (err, links) {
//   if (err) { throw err; }
//   // links est un tableau de hash
//   console.log('links :');
//   console.log(links);
// });

let Promise = require('bluebird');

 
app.get("/data", function (req, res) { 
  Promise.all([
    tasksModel.find(null, function (err, tasks) {
      if (err) { throw err; }
    }), linksModel.find(null, function (err, tasks) {
      if (err) { throw err; }
    })
  ]).then(function(results){
    let tasks = results[0];
    let links = results[1];
 
    // for (var i = 0; i < tasks.length; i++) {
    //   tasks[i].start_date = tasks[i].start_date.format("YYYY-MM-DD hh:mm:ss");
    //   tasks[i].open = true;
    // }
 
    res.send({
      data: tasks,
      collections: { links: links }
    });
 
  }).catch(function(error) {
    sendResponse(res, "error", null, error);
  });
});

// add a new task
app.post("/data/task", function (req, res) { 
  let maTache = new tasksModel();
  let task = getTask(req.body, function(err, task) { 
    if (err) { throw err; }
    maTache.text = task.text;
    maTache.start_date = task.start_date;
    maTache.duration = task.duration;
    maTache.progress = task.progress;
    maTache.parent = task.parent;
  });  
  // let task = {"id":"7","start_date":"29-03-2019","text":getTask(req.body).text,"end_date":"02-04-2019","parent":0};  
 
  // db.query("INSERT INTO gantt_tasks(text, start_date, duration, progress, parent)"
  //   + " VALUES (?,?,?,?,?)", 
  //   [task.text, task.start_date, task.duration, task.progress, task.parent])
  
  // let maTache = new tasksModel();
  // maTache.text = task.text;
  // maTache.start_date = task.start_date;
  // maTache.duration = task.duration;
  // maTache.progress = task.progress;
  // maTache.parent = task.parent;


  maTache.save(function (err) {
    if (err) { throw err; }
    console.log('Commentaire ajouté avec succès !');
  })
  .then (function (result) {
    sendResponse(res, "inserted", result.insertId);
  })
  .catch(function(error) {
    sendResponse(res, "error", null, error); 
  });
});

function getTask(data) {
  return {
    text: data.text,
    start_date: data.start_date.date("YYYY-MM-DD"),
    duration: data.duration,
    progress: data.progress || 0,
    parent: data.parent
  };
}
function getLink(data) {
  return {
    source: data.source,
    target: data.target,
    type: data.type
  };
}
 
function sendResponse(res, action, tid, error) {
 
  if (action == "error")
    console.log(error);
 
  var result = {
    action: action
  };
  if (tid !== undefined && tid !== null)
    result.tid = tid;
 
  res.send(result);
}

// connection au serveur central 
const socket = require('socket.io-client');
let client = socket.connect('http://51.15.137.122:18000/', {reconnect: true});

client.on('connect', () => {
  console.log('connected')

  client.emit('needHelp');
  //console.log(client.emit('needHelp'));
});

app.listen(port, function(){
  console.log("Server is running on port "+port+"...");
});
