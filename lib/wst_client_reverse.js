//###############################################################################
//##
//# Copyright (C) 2014-2015 Andrea Rocco Lotronto
//##
//# Licensed under the Apache License, Version 2.0 (the "License");
//# you may not use this file except in compliance with the License.
//# You may obtain a copy of the License at
//##
//# http://www.apache.org/licenses/LICENSE-2.0
//##
//# Unless required by applicable law or agreed to in writing, software
//# distributed under the License is distributed on an "AS IS" BASIS,
//# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//# See the License for the specific language governing permissions and
//# limitations under the License.
//##
//###############################################################################

var WebSocketClient = require('websocket').client;
var net = require("net");

var bindSockets = require("./bindSockets_reverse");

wst_client_reverse = function() {
  this.wsClientForControll = new WebSocketClient();
}

var rvws = null;    // enable user close reverse ws

wst_client_reverse.prototype.close = function(){
	//console.log("Close connection");
	if(rvws!=null){	rvws.close(); }
}

wst_client_reverse.prototype.start = function(portTunnel, wsHostUrl, remoteAddr) {
  //Getting paramiter
  var url = require("url");
  var urlWsHostObj = url.parse(wsHostUrl);
  var _ref1 = remoteAddr.split(":"), remoteHost = _ref1[0], remotePort = _ref1[1];
  url = "" + wsHostUrl + "/?dst=" + urlWsHostObj.hostname+":"+portTunnel;
  //Connection to Controll WS Server
  this.wsClientForControll.connect(url, 'tunnel-protocol');
  
  this.wsClientForControll.on('connect', (function(_this){
    return function(wsConnectionForControll) {
      //console.log('wsClientForControll for  Controll connected');
      wsConnectionForControll.on('message', function(message) {
        //Only utf8 message used in Controll WS Socket
        //DEBUG MESSAGE FOR TESTING
        //console.log("Message for new TCP Connectio on WS Server");
          
        var parsing = message.utf8Data.split(":");

        //Managing new TCP connection on WS Server
        if (parsing[0] === 'NC'){

          //Identification of ID connection
          var idConnection = parsing[1];
  
          this.wsClientData = new WebSocketClient();
          this.wsClientData.connect(wsHostUrl+"/?id="+idConnection, 'tunnel-protocol');
          //DEBUG MESSAGE FOR TESTING
          //console.log("Call WS-Server for connect id::"+parsing[1]);

          //Management of new WS Client for every TCP connection on WS Server
          this.wsClientData.on('connect', (function(_this){
            return function(wsConnectionForData){
            //Waiting of WS Socket with WS Server
              wsConnectionForData.socket.pause();
              //DEBUG MESSAGE FOR TESTING
              //console.log("WS PAUSE");
              //console.log("Connected wsClientData to WS-Server for id "+parsing[1]+" on localport::"+wsConnectionForData.socket.localPort);
              console.log("Start PIPE wsConnectionForData TCP client to :"+remoteHost+":"+remotePort);
                
              tcpConnection(wsConnectionForData,remoteHost,remotePort);     
            }
          })(this));
        }
      });
      rvws = wsConnectionForControll;
    }
  })(this));
  
  //Management of WS Connection failed
  this.wsClientForControll.on('connectFailed', function(error) {
    console.log('WS connect error: ' + error.toString());
  });

};

function tcpConnection(wsConn,host,port){
  var tcpConn = net.connect({port: port,host: host},function(){
    });

  tcpConn.on("connect",function(){
    //DEBUG MESSAGE FOR TESTING
    //console.log((new Date()) + "CONNECTED TCP---->REMOTE");
    bindSockets(wsConn,tcpConn);
    //Resume of the WS Socket after the connection to WS Server
    wsConn.socket.resume();
    //DEBUG MESSAGE FOR TESTING
    //console.log("RESUME WS");
  });
}

module.exports = wst_client_reverse;
