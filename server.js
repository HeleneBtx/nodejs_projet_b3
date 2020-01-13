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
.then(() => console.log('Connecté à la base de données'))
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
let tasksModel = mongoose.model('gantt_tasks', tasksSchema);

let linksSchema = new mongoose.Schema({
  id : Number,
  source : Number,
  target : Number,
  type : String
});
let linksModel = mongoose.model('gantt_links', linksSchema);

let Promise = require('bluebird');

// recuperation des donnees 
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
 
    // for (let i = 0; i < tasks.length; i++) {
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

function getTask(data) {
  return {
    id: data.id,
    text: data.text,
    start_date: data.start_date.date("YYYY-MM-DD"),
    duration: data.duration,
    progress: data.progress || 0,
    parent: data.parent
  };
}

// ajouter une tache
// app.post("/data/task", function (req, res) { 
//   let maTache = new tasksModel();
//   getTask(req.body, function(err, task) { 
//     if (err) { throw err; }
//     maTache.text = task.text;
//     maTache.start_date = task.start_date;
//     maTache.duration = task.duration;
//     maTache.progress = task.progress;
//     maTache.parent = task.parent;
//   });  

//   maTache.save(function (err) {
//     if (err) { throw err; }
//     console.log('Tache ajoutée avec succès !');
//   })
//   .then (function (result) {
//     sendResponse(res, "inserted", result.insertId);
//   })
//   .catch(function(error) {
//     sendResponse(res, "error", null, error); 
//   });
// });

// supprimer une tache
app.delete("/data/task/:id", function (req, res) {
  let sid = req.params.id;
  tasksModel.remove({ id: sid}, function (err, tasks) {
    if (err) { throw err; }
  })
  .then (function (result) {
    sendResponse(res, "deleted");
  })
  .catch(function(error) {
    sendResponse(res, "error", null, error); 
  });
});

// supprimer un lien
app.delete("/data/link/:id", function (req, res) {
  let sid = req.params.id;
  linksModel.remove({ id: sid}, function (err, tasks) {
    if (err) { throw err; }
  })
  .then (function (result) {
    sendResponse(res, "deleted");
  })
  .catch(function(error) {
      sendResponse(res, "error", null, error); 
  });
});


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
 
  let result = {
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
  console.log('Connecté au serveur central')

  client.emit('needHelp');
  //console.log(client.emit('needHelp'));
});

server.listen(port, function(){
  console.log("Server is running on port "+port+"...");
});
