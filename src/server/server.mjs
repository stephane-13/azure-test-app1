"use strict"

import fs from 'fs';
import http from 'http';
import express from 'express';
import path from 'path';
import { Server } from 'socket.io';

let app    = express();

/*app.use(function(req, res, next) {
  res.setHeader( "Content-Security-Policy", "script-src 'self'; worker-src 'self' http://127.0.0.1:5000" );
  return next();
});*/

// This is to allow the use of SharedBufferArray
app.use(function(req, res, next) {
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

let server = http.Server( app );
let io     = new Server(server);

app.set( 'port', 5000 );
app.use( '/client', express.static( path.join( path.resolve(path.dirname('')), 'src/client' ) ) );
app.use( '/dist', express.static( path.join( path.resolve(path.dirname('')), 'dist' ) ) );
// For direct testing of scripts outside bundle.js
//app.use('/node_modules', express.static( path.join( path.resolve(path.dirname('')), 'node_modules' ) ) );

// Redirect root to client index file
app.get( '/', function( request, response ) {
	response.sendFile( path.join( path.resolve(path.dirname('')), 'src/client/index.html' ) );
});

// Starting the server
server.listen(5000, function() {
  console.log( 'Starting server on port 5000' );
});

// Adding the WebSocket handler
io.on( 'connection', function(socket) {} );

setInterval( function() {
  io.sockets.emit( 'message', 'Hello from server' );
}, 10000 );

var players = {};

io.on( 'connection', function( socket ) 
{
  socket.on( 'new player', function() {
    players[ socket.id ] = {
      x: 300,
      y: 300
    };
  });

  socket.on( 'movement', function( data ) {
    var player = players[socket.id] || {};
    if( data.left ) {
      player.x -= 5;
    }
    if( data.up ) {
      player.y -= 5;
    }
    if( data.right ) {
      player.x += 5;
    }
    if( data.down ) {
      player.y += 5;
    }
  });

});

setInterval( function() {
  io.sockets.emit( 'state', players );
}, 1000 / 60 );



fs.writeFile("/tmp/test", "Hey there!", function(err) {
  if(err) {
      return console.log(err);
  }
  console.log("The file was saved!");
}); 
