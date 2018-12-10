const PORT = parseInt(process.env.PORT) || 3000;

var express = require('express');
var app = express();
var server = require('http').Server(app);


var io = require('socket.io')(server);
var fs = require('fs');
//var mdns = require('mdns')

const os = require('os');
var bodyParser = require('body-parser')
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));


server.listen(PORT, function() {
  //mdns.createAdvertisement(mdns.tcp('emoHub') , PORT).start();
  console.log('Listening on port', PORT);
});

function ParseJson(jsondata) {
  try {
    return JSON.parse(jsondata);
  } catch (error) {
    return null;
  }
}

function sendTime() {
  io.sockets.emit('atime', {
    time: new Date().toJSON()
  });
}

/*
var mongoose = require('mongoose');
mongoose.connect('mongodb://158.132.36.161:27017/emoHub');
mongoose.Promise = global.Promise;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Database is connected");
});

var sensorSchema = new mongoose.Schema({
  type: String,
  timestamp: Number,
  data: mongoose.Schema.Types.Mixed
});

var SensorData = mongoose.model('collection_'+(new Date()).toISOString().substring(0,13), sensorSchema);
*/
//var start = function(){console.log("change collection");console.log((new Date()).toISOString());SensorData=mongoose.model('collection_'+(new Date()).toISOString().substring(0,13),sensorSchema)}
/*
function targettime (){
	var target = new Date();
	target.setMilliseconds(0);
	target.setSeconds(0);
	target.setMinutes(0);
	target.setHours(target.getHours()+1);
	//target.setMinutes(target.getMinutes()+1);
	return target.getTime()-(new Date()).getTime();
}

setTimeout(function(){
	console.log((new Date()).getTime())
	//start();
	setInterval(start,60000*60);
},targettime())
*/
var ROOM_monitor = io.of('/EDA-MONITOR');
ROOM_monitor.on('connection', function(socket) {

  console.log('someone connected');
});

/*
function getdetector(socket){
  var detector = spawn('python3',['../../analysis/Python_dataAnalysis/emo_process.py']);

  var emotion_analyser_result = readline.createInterface({
  input: detector.stdout,
  output:detector.stdin
})

emotion_analyser_result.on('line', (input) => {
  console.log(`Received: ${input}`);
  console.log("Received JSON: ",JSON.parse(input));
  ROOM_monitor.emit('TRIGGER', JSON.parse(input));
});


detector.stdout.on('end', function(){
  console.log('output ended');
});

detector.stderr.on('data', (err)=>{
  console.log(`stderr: ${err}`);
});

detector.on('error', (err) => {
  console.log('Failed to start subprocess.');
});

  return detector
}
*/
const spawn = require('child_process').spawn;
const readline = require('readline');

io.on('connection', function(socket) {
  //socket.emotion_analyser = getdetector(socket);
  socket.deviceID = '001';
  // console.log("Device: " + socket.id + " Connected");
  console.log('\nsomeone connected:\n'+
      ' host: '+socket.handshake.headers.host.split(":").shift()+'\n'+
      ' ip  : '+socket.handshake.address);

  socket.emit('welcome', {
    message: 'Connected !!!!'
  });
  socket.on('connection', function(data) { /*console.log(data); */ });

  socket.on('EDA', function(data) {
    data.timestamp = (new Date()).toISOString();
    data.type = "GSR";
    console.log(data);
    //	SensorData.create(data);
  });
  var moment = require('moment');
  socket.on('EDA_BATCH', (data) => {
    data.timestamp = moment().subtract(100, 'ms');
    data.type = "GSR";

    data.data = data.data.split(",").map((sample) => {
      var item = sample.split(" ");
      return {
        median: item[0],
        raw: item[1]
      }
    });
    console.log(data);
    var textformData = data.data.map((item, idx) => {
      return data.timestamp.add(1, 'ms').format("DD-MM-YYYY HH:mm:ss.SSS") + ',' + item.median + ',' + item.raw
    })

    const file = fs.createWriteStream('./emo.csv', {
      'flags': 'a'
    });

    textformData.forEach((item) => {
      file.write(item + '\r\n');
    })

    file.end();


    //socket.emotion_analyser.stdin.write(JSON.stringify(data));
    //socket.emotion_analyser.stdin.write(os.EOL);
    ROOM_monitor.emit('EDA', data);
  })
  socket.on('data', (data) => {
    datastring = moment(data.timestamp).format("DD-MM-YYYY HH:mm:ss.SSS") + ',' + data.type + ',' + JSON.stringify(data.data)
    console.log(datastring);

    fs.appendFile('E4.csv',
      datastring,
      function(err) {
        if (err) throw err;
      });
    if (data.type == 'GSR') {
      ROOM_monitor.emit('EDA', {
        data: [{
          median: 0,
          raw: data.data
        }]
      })
      console.log("send");
    }
  });

  socket.on('disconnect', function() {
    console.log(socket.id + ' disconnected!')
  })
});


//=====================================================================================
//                             Express Routes
//=====================================================================================

app.get('/getdata', (req, res) => {

  var myhtml = `
    <form action="/getdata" method="POST">
      Collection:
      <strong><span id="collection">No collection has been chosen</span></strong>
      <br><br>
      From:<br>
      <input type="text" name="starttime" >
      <br>
      To:<br>
      <input type="text" name="endtime">
      <br>
      Sensor types (comma seperated):<br>
      <input type="text" name="sensor">
      <br><br>
      <button type="submit" name="filetype" value="emo">Get emoBadge</button>
      <button type="submit" name="filetype" value="E4">Get E4</button>
    </form>
    `
  //console.log(Object.keys(db.collections))

  res.send(myhtml)

});


app.post('/getdata', (req, res) => {
  //console.log(JSON.stringify(req.body.filetype));
  //res.contentType('text/plain');
  //res.set('Content-Disposition','attachment; filename='+ req.body.filetype+'.csv');
  var readfile = fs.createReadStream(path.resolve('./'+req.body.filetype+'.csv'));
  readfile.pipe(res);

  // var CTA = require("csv-to-array");
  // var columns=["time","amplitude","thersholdLine"];
  // var theCSV = CTA({
  //   file: path.resolve('./' + req.body.filetype + '.csv'),
  //   columns: columns
  // }, function(err, array) {
  //   console.log(array.length);
  //   res.send(err || array);
  // });
})

/*
app.post('/getdata',(req,res)=>{
  console.log(req.body);
  res.download(path.join(__dirname, './test.txt'),req.body.starttime+'-'+req.body.endtime+(req.body.sensor.trim()==''?'':'['+req.body.sensor+']')+'.'+req.body.filetype)
})
*/
const path = require('path');

app.get('/monitor', (req, res) => {
  console.log(path.resolve('./public/WebMonitor.html'));
  res.sendFile(path.resolve('./public/WebMonitor.html'));
})

app.use(express.static(path.resolve('./public/')))
