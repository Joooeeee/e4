
const app = require('express')();
const debug = require('debug');
const path = require('path');
var client_socket=require ('socket.io-client')('http://192.168.42.157:3000');
var player = require('node-aplay');

let status=new class{
  constructor(){
    this._light=false;
    this._music=false;
    this._trigger=false;
  }
  get trigger(){
    return this._trigger;
  }
  set trigger(value){
    if(this._trigger!=value){
      //if false
      this._trigger=value;
      this.music=value;
      this.light=value;
    }
  }
  set music(value){
    if(this._music!=value){
      this._music=value;
      if(value) musicPlayer(value);
    }
  }
  set light(value){
    if(this._light!=value){
      this._light=value;
      if(value) lightOnOff(value);
    }
  }
}
function lightOnOff(value){
  return;
}
function musicPlayer(value){
  if(value){
    console.log("now play music");
    console.log(path.resolve(__dirname+'./asset/music/mario-Ringtone.wav'));
    var music=new player(path.resolve(__dirname,'./asset/music/mario-Ringtone.wav'));
    music.play();
    music.on('complete',()=>{
      if(status.trigger){
        musicPlayer(true);
      }
    })
  }

}
client_socket.on('connect',function(){
  // client_socket.emit('getTrigger_status');
  console.log("connected to server");
  //status.trigger=true;
  // status.trigger=1;
});
client_socket.on('trigger',function(data){
  status.trigger=data.trigger;
});
client_socket.on('disconnect',function(){
  // client_socket.emit('getTrigger_status');
  console.log("disconnect");

  // status.trigger=1;
});






//var client = require('http').Server(app);

// var io = require('socket.io')(server);
// var fs = require('fs');
//var mdns = require('mdns')
