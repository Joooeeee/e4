const app = require('express')();
// const debug = require('debug');
const path = require('path');
const io = require('socket.io-client');
const child_process = require('child_process');
const moment = require('moment');
const fs = require('fs');
// const promise = require


//=============================================================================
//
//                               variable
//
//=============================================================================

var client_socket;
var BLEPython;
var databuf;
var counter;
var status;
var music={
};

//=============================================================================
//
//                            end of variable
//
//=============================================================================

//=============================================================================
//
//                            initialization
//
//=============================================================================
init();

function init() {
  var currentTime= moment(new Date()).format("DD-MM-YYYY HH:mm:ss");
  init_variable();

  client_socket = io('http://192.168.42.12:3000/receiver').on('connect', (socket) => {
    console.log('I connected to server');
    keepSendingBUffer();
    client_socket.on('trigger', function(data) {
      console.log(data)
      status.trigger = data.trigger;
    });
    client_socket.on('disconnect', function() {
      console.log("I disconnected to server");
    });
  });

  BLEPython = child_process.spawn('python', ['i2c.py']);
  BLEPython.stderr.on('data',function(error){
    console.log(error.toString('utf8'));
  })
  BLEPython.stdout.on('data', function(data_utf8) {
    try {

      var data_str = data_utf8.toString('utf8');
      if (data_str.includes('Data:')) {
        var value = (data_str.substr(6)).split(':');
        console.log(value);
        var resistance=parseInt(value[4]);
        var conductivity=Math.abs(-(Math.log(resistance)/Math.log(1560000))+1);
        var information = {
          information: conductivity,
          recordtime: moment(new Date()).format("DD-MM-YYYY HH:mm:ss.SSS"),
          type: 'GSR',
          count: value[2]
        };
        databuf.push(information);
        if(information.information) datastring=information.recordtime+','+information.type+','+information.information+'\n';
        else datastring=moment(new Date()).format("DD-MM-YYYY HH:mm:ss.SSS")+','+'GSR'+','+'0'+'\n'
        console.log(datastring);

        fs.appendFile('./asset/data/E4_'+currentTime+'.csv',
          datastring,
          function(err) {
            if (err) throw err;
          });
        keepSendingBUffer();
      }
    } catch (error) {
      console.log(error);
    }
  });
  console.log("initialization complete");
}

function init_variable() {
  databuf = [];
  counter = 0;
  status = new class {
    constructor() {
      this._light = false;
      this._music = false;
      this._trigger = false;
    }
    get trigger() {
      return this._trigger;
    }
    set trigger(value) {
      if (this._trigger != value) {
        //if false
        this._trigger = value;
        this.music = value;
        this.light = value;
      }
    }
    set music(value) {
      if (this._music != value) {
        this._music = value;
        //if(value) playMusic(value);
      }
    }
    set light(value) {
      if (this._light != value) {
        this._light = value;
        lightOnOff(value);
      }
    }
  }
}

//=============================================================================
//
//                         end of initialization
//
//=============================================================================

//=============================================================================
//
//                                function
//
//=============================================================================

function keepSendingBUffer(){
  //if client socket is connected and databuf has data
  return new Promise(function(resolve,reject){

    while (true) {

      if (client_socket.connected&&databuf.length>0) {
        var sendingdata={
          type: databuf[0].type,
          information: databuf[0].information,
          recordtime: databuf[0].recordtime,
          count: databuf[0].count
        };
        //console.log("I am sending:"+JSON.stringify(sendingdata));
        client_socket.emit('data', sendingdata );
        databuf.shift();
      } else {
        // console.log(databuf.length+' data are waiting to send........');
        resolve();
        break;
      }
    }
  });
}

function lightOnOff(value) {
  return;
}

function playMusic(value) {
  console.log("play music");
  if (value) {
    music.mario = child_process.exec('aplay ./asset/music/mario-Ringtone.wav',(error,stdout,stderr)=>{

        if (status.trigger) {
          playMusic(true);
        }
    })

  }
  // else {
  //   console.log("try pause");
  //   music.pause()
  // }
}

//=============================================================================
//
//                             end of function
//
//=============================================================================
