'use strict'

//import $ from 'jquery';

//import * as http from 'http';

import * as THREE from 'three';
//import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";

import io from 'socket.io-client';

import { Keystate, Mousestate } from "./input.js";
import { Vehicle } from "./vehicle.js";

import * as build from "../build.js";

//import Universe from 'worker-loader?publicPath=/dist/!./universe.js';
//import Random from 'worker-loader?publicPath=/dist/!./random.js';

//import Universe from './universe.js';
//import Random from './random.js';

//import { Worker } from 'worker_threads';

console.log( 'index.js starting');

/** @type {Worker} */
let universeWorker;
/** @type {Worker} */
let randomWorker;

const sab = new SharedArrayBuffer(1024);
const int32 = new Int32Array(sab);

const sharedFloats = new Float32Array(new SharedArrayBuffer(1024));
sharedFloats.set([0.1,0.2], 0);

/** @type {THREE.Scene} */
let scene0;
let scene2;
let scene3;

let bufferScene;
let bufferTexture;


/** @type {THREE.WebGLRenderer} */
export let renderer;
/** @type {THREE.PerspectiveCamera} */
let camera1;
let camera3;
/** @type {THREE.Light} */
let light;

/** @type {io} */
let socket;

/** @type {Keystate} */
let keystate;
/** @type {Mousestate} */
let mousestate;

// Player object
export let player = new THREE.Object3D();
let position = [
  new THREE.Vector3( 0.0, 0.0, 0.0 ), // Layer 0 position: universe level
  new THREE.Vector3( 0.0, 0.0, 0.0 ), // Layer 1 position: galactic level
  new THREE.Vector3( 0.0, 0.0, 0.0 ), // Layer 2 position: stellar system level
  new THREE.Vector3( 0.0, 0.0, 0.0 ), // Layer 3 position: planetary level
];

var texturedCube;
var cubeX, cubeY, cubeZ;

// Ship object
let ship = new Vehicle( new THREE.Vector3( 0, 0, 50 ) );
// Add some thrusters to the ship (note: z-axis points backward)
ship.addThruster( 'KeyW',      new THREE.Vector3( 0.0, 0.0, 0.0 ), new THREE.Vector3( 0.0,  0.0, -1.0 ), 45000, 15000 );
ship.addThruster( 'KeyS',      new THREE.Vector3( 0.0, 0.0, 0.0 ), new THREE.Vector3( 0.0,  0.0,  1.0 ), 45000, 15000 );
ship.addThruster( 'KeyA',      new THREE.Vector3( 0.0, 0.0, 0.0 ), new THREE.Vector3( -1.0, 0.0,  0.0 ), 45000, 15000 );
ship.addThruster( 'KeyD',      new THREE.Vector3( 0.0, 0.0, 0.0 ), new THREE.Vector3( 1.0,  0.0,  0.0 ), 45000, 15000 );
ship.addThruster( 'ShiftLeft', new THREE.Vector3( 0.0, 0.0, 0.0 ), new THREE.Vector3( 0.0, -1.0,  0.0 ), 45000, 15000 );
ship.addThruster( 'Space',     new THREE.Vector3( 0.0, 0.0, 0.0 ), new THREE.Vector3( 0.0,  1.0,  0.0 ), 45000, 15000 );

ship.addThruster( 'KeyQ',      new THREE.Vector3(  1.0, 0.0, 0.0 ), new THREE.Vector3( 0.0,  1.0,  0.0 ), 3000, 1000 );
ship.addThruster( 'KeyQ',      new THREE.Vector3( -1.0, 0.0, 0.0 ), new THREE.Vector3( 0.0, -1.0,  0.0 ), 3000, 1000 );

ship.addThruster( 'KeyE',      new THREE.Vector3(  1.0, 0.0, 0.0 ), new THREE.Vector3( 0.0, -1.0,  0.0 ), 3000, 1000 );
ship.addThruster( 'KeyE',      new THREE.Vector3( -1.0, 0.0, 0.0 ), new THREE.Vector3( 0.0,  1.0,  0.0 ), 3000, 1000 );

ship.addThruster( 'MouseLeft',  new THREE.Vector3(  1.0, 0.0, 0.0 ), new THREE.Vector3( 0.0, 0.0, -1.0 ), 1000, 200 );
ship.addThruster( 'MouseLeft',  new THREE.Vector3( -1.0, 0.0, 0.0 ), new THREE.Vector3( 0.0, 0.0,  1.0 ), 1000, 200 );

ship.addThruster( 'MouseRight', new THREE.Vector3(  1.0, 0.0, 0.0 ), new THREE.Vector3( 0.0, 0.0,  1.0 ), 1000, 200 );
ship.addThruster( 'MouseRight', new THREE.Vector3( -1.0, 0.0, 0.0 ), new THREE.Vector3( 0.0, 0.0, -1.0 ), 1000, 200 );

ship.addThruster( 'MouseUp',    new THREE.Vector3( 0.0,  1.0, 0.0 ), new THREE.Vector3( 0.0, 0.0,  1.0 ), 1000, 200 );
ship.addThruster( 'MouseUp',    new THREE.Vector3( 0.0, -1.0, 0.0 ), new THREE.Vector3( 0.0, 0.0, -1.0 ), 1000, 200 );

ship.addThruster( 'MouseDown',  new THREE.Vector3( 0.0,  1.0, 0.0 ), new THREE.Vector3( 0.0, 0.0, -1.0 ), 1000, 200 );
ship.addThruster( 'MouseDown',  new THREE.Vector3( 0.0, -1.0, 0.0 ), new THREE.Vector3( 0.0, 0.0,  1.0 ), 1000, 200 );




function init3D() {

  // Create the scene objects
  scene0 = new THREE.Scene();
  scene2 = new THREE.Scene();
  scene3 = new THREE.Scene();

  bufferScene = new THREE.Scene();
  bufferTexture = new THREE.WebGLRenderTarget( 256, 256, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});

  // Create the renderer object
  renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  // Hide scrolling bars
  document.body.style.overflow = 'hidden';
  document.body.insertBefore( renderer.domElement, document.body.firstChild );

  var horizontalFOV = 90.0;
  let verticalFOV = 2 * Math.atan( Math.tan( horizontalFOV * Math.PI / 360 ) * ( window.innerHeight / window.innerWidth ) ) * 180 / Math.PI;
  //let verticalFOV = ( Math.atan( Math.tan( ( ( horizontalFOV / 2.0 ) * Math.PI ) / 180.0 ) / ( window.innerWidth / window.innerHeight ) ) * 2.0 * 180.0 ) / Math.PI;
  console.log( 'Vertical FOV: ' + verticalFOV );
  camera1 = new THREE.PerspectiveCamera( verticalFOV, window.innerWidth / window.innerHeight, 1e-6, 1e27 );
  camera3 = new THREE.PerspectiveCamera( verticalFOV, window.innerWidth / window.innerHeight, 1e-6, 1e27 );

  /*camera.projectionMatrix.set( 
    window.innerHeight / window.innerWidth,0,0 ,0,
    0    ,1,0 ,0,
    0    ,0,-1,-0.000002,
    0    ,0,-1,0
  );*/

  light = new THREE.PointLight( 0xffffff, 1 );
  //camera3.add( light );
  scene0.add( camera1 );
  scene2.add( camera3 );
  scene3.add( camera3 );

  // Add viewport resizing capability
  window.onWindowResize = function(){
    camera1.aspect = window.innerWidth / window.innerHeight;
    camera3.aspect = window.innerWidth / window.innerHeight;
    verticalFOV = 2 * Math.atan( Math.tan( horizontalFOV * Math.PI / 360 ) * ( window.innerHeight / window.innerWidth ) ) * 180 / Math.PI;
    camera1.fov = verticalFOV;
    camera3.fov = verticalFOV;
    camera1.updateProjectionMatrix();
    camera3.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  window.addEventListener( 'resize', window.onWindowResize, false );

  console.log( 'WebGL 2: ', renderer.capabilities.isWebGL2 );

  return( true );
}



function initWorkers() {

  // CHeck if Web Workers (threads) are supported
  if( typeof( Worker ) !== 'undefined' ) {
      console.log( 'Web Workers support enabled.' );
    } else {
      console.log( 'Required Web Workers support is missing.' );
      return false;
    }

  // Create Web Workers
  universeWorker = new Worker(new URL('./universe.js', import.meta.url));
  randomWorker = new Worker(new URL('./random.js', import.meta.url));

  // Implement messaging
  universeWorker.onmessage = function( event ){
    console.log( 'Main thread received "universe" worker message ' + event.data );
  };

  randomWorker.onmessage = function( event ){
    console.log( 'Main thread received "random" worker message ' + event.data );
    console.log( event.data );
    if( event.data[0] == 'texture' ) {
      let typedBuffer = new Uint8Array( event.data[1] );
      console.log( typedBuffer );
      let texture = new THREE.DataTexture( typedBuffer, 256, 256, THREE.RGBAFormat );
      texture.needsUpdate = true;
      let textureMaterial = new THREE.MeshBasicMaterial();
      textureMaterial.map = texture;
      
      texturedCube = new THREE.Mesh( new THREE.BoxGeometry( 3, 3, 3 ), textureMaterial );
      texturedCube.position.set( 20,20,0 );
      scene3.add( texturedCube );
    }
  }

  return( true );
}



function initSocket() {
  socket = io();

  socket.on( 'message', function( data ) {
    console.log( data );
  });

  socket.on( 'state', function( players ) {
    //console.log( 'state' );
    //console.log( players );
    /*context.clearRect( 0, 0, 800, 600 );
    context.fillStyle = 'green';
    for( var id in players ) {
      var player = players[id];
      context.beginPath();
      context.arc( player.x, player.y, 10, 0, 2 * Math.PI );
      context.fill();
    }*/
  });

  socket.emit( 'new player' );

  setInterval( function() {
    socket.emit( 'movement', keystate );
  }, 1000 / 60 );

  return( true );
}



function initInput() {
  keystate = new Keystate();
  mousestate = new Mousestate();
  return( true );
}



function init() {

  if( ! init3D() ) return( false );
  if( ! initWorkers() ) return( false );
  if( ! initSocket() ) return( false );
  if( ! initInput() ) return( false );
  return( true );

}

if( ! init() ) throw new Error( 'ERROR - Unable to complete initialization.' );



console.log( 'Version: ' + build.VERSION );
console.log( 'Hardware concurrency: ' + navigator.hardwareConcurrency );


var radius = 20;

var geometry = new THREE.SphereGeometry( 5, 8, 8 );
//geometry.lookAt( new THREE.Vector3(0,-1,0) ); // Makes the top point in x direction
//geometry.lookAt( new THREE.Vector3(1,0,0) ); // Makes the top point in x direction

cubeX = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
cubeX.position.set( radius*1.1,0,0 );
scene3.add( cubeX );

//geometry.lookAt( new THREE.Vector3(-1,0,0) ); // Makes the top point in x direction
cubeY = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) );
cubeY.position.set( 0,radius*1.1,0 );
scene3.add( cubeY );

cubeZ = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x0000ff } ) );
cubeZ.position.set( 0,0,radius*1.1 );
scene3.add( cubeZ );

const rawMaterial = new THREE.RawShaderMaterial( {
  glslVersion: THREE.GLSL3,
  uniforms: {
    logDepthBufFC: { value: 0.01 },
    time: { value: 1.0 },
    fuzzyPointRendering: { value: false },
  },
  defines: {
    USE_LOGDEPTHBUF: 1,
  },
  vertexShader: document.getElementById( 'vertexShader' ).textContent,
  fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
  side: THREE.DoubleSide,
  depthTest: true,
  transparent: true
} );

const rawPointLightMaterial = new THREE.RawShaderMaterial( {
  glslVersion: THREE.GLSL3,
  uniforms: {
    logDepthBufFC: { value: 0.01 },
    time: { value: 1.0 },
    fuzzyPointRendering: { value: true },
  },
  defines: {
    USE_LOGDEPTHBUF: 1,
  },
  vertexShader: document.getElementById( 'vertexShader' ).textContent,
  fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
  side: THREE.DoubleSide,
  /*depthTest: false,
  blending: THREE.AdditiveBlending,
  transparent: false*/
  depthTest: true,
  transparent: true
} );

let positions = [];
let normals = [];
let colors = [];
let lights = [];

let vertex1 = new THREE.Vector3();
let vertex2 = new THREE.Vector3();
let crossVector1 = new THREE.Vector3();
let crossVector2 = new THREE.Vector3();
let color1 = new THREE.Color();

for ( let i = 0; i < 1000; i ++ ) {

  // positions

  let x1 = Math.random() * 50 - 25;
  let y1 = Math.random() * 50 - 25;
  let z1 = Math.random() * 50 - 25;
  let x2 = x1 + Math.random() * 2 - 1;
  let y2 = y1 + Math.random() * 2 - 1;
  let z2 = z1 + Math.random() * 2 - 1;
  let x3 = x1 + Math.random() * 2 - 1;
  let y3 = y1 + Math.random() * 2 - 1;
  let z3 = z1 + Math.random() * 2 - 1;
  positions.push( x1, y1, z1 );
  positions.push( x2, y2, z2 );
  positions.push( x3, y3, z3 );

  vertex1.set( x1, y1, z1 );
  vertex2.set( x2, y2, z2 );
  crossVector1.subVectors( vertex2, vertex1 ); 
  vertex2.set( x3, y3, z3 );
  crossVector2.subVectors( vertex2, vertex1 ); 

  let n1 = crossVector1.cross( crossVector2 );
  n1.normalize();

  normals.push( n1.x, n1.y, n1.z );
  normals.push( n1.x, n1.y, n1.z );
  normals.push( n1.x, n1.y, n1.z );

  let cr = Math.random();
  let cg = Math.random();
  let cb = Math.random();
  color1.setRGB( cr, cg, cb );

  colors.push( color1.r, color1.g, color1.b );
  colors.push( color1.r, color1.g, color1.b );
  colors.push( color1.r, color1.g, color1.b );

  lights.push( Math.random() );
  lights.push( Math.random() );
  lights.push( Math.random() );
}

var bufferArraysGeometry = new THREE.BufferGeometry();
bufferArraysGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
bufferArraysGeometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
bufferArraysGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
bufferArraysGeometry.setAttribute( 'light', new THREE.Float32BufferAttribute( lights, 1 ) );

/*const trianglesMaterial = new THREE.MeshBasicMaterial( {
  specular: 0xffffff, shininess: 250,
  side: THREE.DoubleSide, vertexColors: true
} );*/

//let randomTrianglesMesh = new THREE.Mesh( bufferArraysGeometry, trianglesMaterial );
let randomTrianglesMesh = new THREE.Mesh( bufferArraysGeometry, rawMaterial );
scene3.add( randomTrianglesMesh );





// Scene 2 : galaxy level

const particlePositions = [];
const particleColors = [];
let particleLights = [];
let particleSizes = [];
const color = new THREE.Color();
const n = 100, n2 = n * 0.5;

// Prepare a rotation matrix that will be applied at all points to orient them along a vector
const rotationMatrix = new THREE.Matrix4();
const rotationAxis = new THREE.Vector3( Math.random(), Math.random(), Math.random() );
rotationAxis.normalize();
const rotationAngle = Math.random() * Math.PI / 2.0;
rotationMatrix.makeRotationAxis( rotationAxis, rotationAngle );

// A galasy can have several different features defining its shape
// It can be elliptical, spiral, or irregular
// It can also have a bar or a ring
// The central buldge is more or less pronounced
// Finally, a galaxy also has a halo
// All these features are defined by a set of parameters

// This is the formula for a spiral in spherical coordinates
// r = a * e^( b * theta )
// And in cartesian coordinates:
// x = a * cos( phi + theta ) * e^( c * theta )
// y = a * sin( phi + theta ) * e^( c * theta )

// 10'000 particles : 90 watts
// 100'000 particles : 100 watts
// 1'000'000 particles : 200 watts

// In order to be able to draw a galaxy efficiently, we need to be able to divide it into cells, which can be sorted by distance to the camera
// If the rendering uses opaque objects, nearest cells will be drawn first
// If the rendering uses transparent objects, farthest cells will be drawn first
// An individual cell luminosity - i.e. number of stars - depends on the closeness to the logaritmic spiral arms of the galaxy and to the distance to the central buldge

// Let's generate 100x100x10 cells in the x,y.z space
let iPointsCounter = 0;
let invCellsPerAxis = 1.0 / 14;
for( let x = - 0.5; x < 0.5; x += invCellsPerAxis ) {
  for( let y = -0.5; y < 0.5; y += invCellsPerAxis ) {
    for( let z = -0.5; z < 0.5; z += invCellsPerAxis ) {
      // Generate one point in the cell
      let px =  x + invCellsPerAxis * ( Math.random() - 0.5 );
      let py =  y + invCellsPerAxis * ( Math.random() - 0.5 );
      let pz =  z + invCellsPerAxis * ( Math.random() - 0.5 );
      // Calculate the distance to the center of the galaxy
      //const distCenter = Math.sqrt( x * x + y * y + z * z );
      const distCenter = Math.sqrt( px * px + py * py );
      // Then calculate the angle in the xy plane
      //const theta = Math.atan2( y, x );
      // Then calculate the distances to the logarithmic spiral arms
      // We will consider s arms
      let sumArmsFactors = 0.0;
      let minDistArm = 1000000.0;
      let numArms = 6;
      for( let s = 0; s < numArms; s ++ ) {
        // Calculate the minimal distance between the point x y z and anywhere on the spiral arm
        for( let theta = 0; theta < 2.0 * Math.PI; theta += 0.1 ) {
          // The spiral arms are defined by a logarithmic spiral
          // Calculate the position of the spiral arm at angle theta
          // phi controls the rotation of the spiral arms
          let phi = s * 2.0 * Math.PI / numArms;
          // c controls the geometric progression of the spiral
          let c = 0.47;
          c = 0.733;
          // a controls the size of the spiral
          let a = 0.045;
          a = 0.01;
          // Arm position at angle theta
          let ax = a * Math.cos( phi + theta ) * Math.exp( c * theta );
          let ay = a * Math.sin( phi + theta ) * Math.exp( c * theta );
          let distArms = ( px - ax ) * ( px - ax ) + ( py - ay ) * ( py - ay );
          if( distArms < minDistArm ) {
            minDistArm = distArms;
          }
        }
      }
      sumArmsFactors += 1.0 / ( 2000.0 * minDistArm + 1.0 );


      // Reduce the brightness based on distance to the center
      sumArmsFactors *= 1.5 / ( 10.0 * distCenter *  distCenter + 1.0 );

      // If the brightness doesn't reach a certain threshold, don't draw the point
      if( sumArmsFactors < 0.5 ) {
        continue;
      }
      iPointsCounter ++;

      particlePositions.push( 50.0 * px, 50.0 * py, -100.0 + 5.0 * pz );
      // colors
      let gray = sumArmsFactors * 0.9 + Math.random() * 0.1;
      //gray = 1.0;
      color.setRGB( gray, gray, gray, THREE.SRGBColorSpace );
      particleColors.push( color.r, color.g, color.b );
      particleLights.push( 1.0 );
      particleSizes.push( 50.0 );
    }
  }
}
console.log( 'Number of points: ' + iPointsCounter );
/*
for ( let i = 0; i < 10000; i ++ ) {


  // Generate spherical coordinates
  const r = Math.random();
  const a = Math.random() * Math.PI * 2.0;
  const b = Math.random() * Math.PI - Math.PI / 2.0;
  // Generate cartesian coordinates
  const x = 50.0 * r * Math.cos( b ) * Math.cos( a );
  const y = 50.0 * r * Math.cos( b ) * Math.sin( a );
  const z = 5.0 * r * Math.sin( b );

  // Apply the rotation matrix to the point
  const point = new THREE.Vector3( x, y, z );
  point.applyMatrix4( rotationMatrix );
  
  particlePositions.push( point.x, point.y, -100.0 + point.z );

  // colors
  const gray = Math.random() * 0.3 + 0.5;
  color.setRGB( gray, gray, gray, THREE.SRGBColorSpace );
  particleColors.push( color.r, color.g, color.b );

  particleLights.push( Math.random() );
  // Particles will not be sized in the shader based on distance to camera
  // The reason is that depth buffering is disabled for particles and if they cover the whole screen, performance will be badly impacted
  // So the size is kept constant, so the number of redrawn pixels is constant too -> no fps impact of distance
  //particleSizes.push( 100.0 * ( 0.9 * Math.random()  * ( 1 - r ) + 0.1  ) );
  //particleSizes.push( 1.0 );
  particleSizes.push( 100.0 * ( 0.9 * 1.0 * ( 1 - r ) + 0.1  ) );
  //particleSizes.push( 100.0 );
}
*/
const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( particlePositions, 3 ) );
particleGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( particleColors, 3 ) );
particleGeometry.setAttribute( 'light', new THREE.Float32BufferAttribute( particleLights, 1 ) );
particleGeometry.setAttribute( 'size', new THREE.Float32BufferAttribute( particleSizes, 1 ) );

var points = new THREE.Points( particleGeometry, rawPointLightMaterial );
//var points = new THREE.Points( particleGeometry, rawMaterial );

scene2.add( points );








// Scene 0: universe level
let linePoints = [];
let lineColors = [];

for ( let i = 0; i < 100; i ++ ) {
  let x1 =  Math.random() * 50 - 25;
  let y1 =  Math.random() * 50 - 25;
  let z1 =  Math.random() * 50 - 25;
  let x2 =  x1 + Math.random() * 6 - 3;
  let y2 =  y1 + Math.random() * 6 - 3;
  let z2 =  z1 + Math.random() * 6 - 3;
  linePoints.push( x1, y1, z1, x2, y2, z2 );
  lineColors.push( Math.random(), Math.random(), Math.random(), Math.random(), Math.random(), Math.random() );
}

var bufferArraysLineGeometry = new THREE.BufferGeometry();

// The positions will change on a continuous basis
const positionAttribute = new THREE.Float32BufferAttribute( linePoints, 3 );
positionAttribute.setUsage( THREE.StreamDrawUsage );

bufferArraysLineGeometry.setAttribute( 'position', positionAttribute );
bufferArraysLineGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( lineColors, 3 ) );

const lineMaterial = new THREE.LineBasicMaterial( { vertexColors: true } );

let linesMesh = new THREE.LineSegments( bufferArraysLineGeometry, lineMaterial );
scene0.add( linesMesh );






randomWorker.postMessage( 'texture' );

universeWorker.postMessage( [ 'shared_buffer', sab ] );
universeWorker.postMessage( [ 'generate', position[0] ] );

let elapsedTime = 0;
let clock = new THREE.Clock();
//var lastDebugDump = lastFrameTime;
const fpsLimit = 0.01;

function animate() {

  requestAnimationFrame( animate );

  // Get the time elapsed since last frame
  elapsedTime += clock.getDelta();
  // TODO: elapsed time can be huge if the tab lost focus for a while - address this by forcing game to exit in that scenario?
  // Note: most browsers also limit setInterval to a minimum of 1000ms in tabs without focus
  //let elapsedTime = now - lastFrameTime;
  // TODO: For now, stupidly skip large elapsed times - this correponds to some time freeze for the player, so it's not ok for a multiplayer game
  /*if( elapsedTime > 500 || document.hidden ) {
    lastFrameTime = now;
    requestAnimationFrame( animate );
    return;
  }*/
  if( elapsedTime > 1.0 ) {
    console.log( elapsedTime );
    elapsedTime = 0.01;
  }

  // Dump debug data and to test things
  //if( now - lastDebugDump > 5000 ) {
  //  lastDebugDump = now;
  //  universeWorker.postMessage( [ 'generate', position[0] ] );
  //}

  // Limit FPS
  if( elapsedTime < fpsLimit ) {
    return;
  }

  //console.log( delta );
  ship.processThrusters( elapsedTime, keystate, mousestate );
  mousestate.settleMouse();

  // Layer 0 geometry update
  for ( let i = 0; i < 600; i ++ ) {
    linePoints[i] += elapsedTime * ( Math.random() - 0.5 );
  }

  bufferArraysLineGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( linePoints, 3 ) );

  // Traverse all objects of scene3 and offset their position by the inverse of the ship position
  scene3.traverse( ( oObject ) => {
    if( oObject.type !== 'Mesh' && oObject.type !== 'PointLight' && oObject.type !== 'Points' ) {
      //console.log( oObject.type );
      return;
    }
    oObject.position.addScaledVector( ship.speed, -elapsedTime );
  });

  // Traverse all objects of scene2 and offset their position by the inverse of the ship position
  scene2.traverse( ( oObject ) => {
    if( oObject.type !== 'Mesh' && oObject.type !== 'PointLight' && oObject.type !== 'Points' ) {
      //console.log( oObject.type );
      return;
    }
    oObject.position.addScaledVector( ship.speed, -elapsedTime / 100.0 );
  });

  /*scene3.translateX( -ship.speed.x * elapsedTime * 0.001 );
  scene3.translateY( -ship.speed.y * elapsedTime * 0.001 );
  scene3.translateZ( -ship.speed.z * elapsedTime * 0.001 );*/
  /*scene3.position.addScaledVector( ship.speed, -elapsedTime * 0.001 );*/

  // Note scene0 objects are not moving, in order to simulate a long distance

  // The ship position is not actually used anymore
  // The camera stays at the origin, and all objects are moved instead (see above)
  // This is called floating origin, and allows floating point precision to be maximum near the camera
  camera1.position.copy( position[0] );
  camera1.quaternion.copy( ship.quaternion );
  //camera3.position.copy( ship.position );
  camera3.position.copy( position[0] );
  camera3.quaternion.copy( ship.quaternion );

  //console.log( camera.position );
  //console.log( camera.quaternion );

  renderer.render( bufferScene, camera1, bufferTexture );

  // Draw the background scene (colored moving lines)
  renderer.render( scene0, camera1 );
  // Don't clear all buffers
  renderer.autoClear = false;
  // But clear the depth buffer to make sure than scene0 is always behind scene3
  renderer.clear(false, true, false);
  // Draw the forgreound scene
  // Disable depth test just for scene2
  //renderer.context.disable(renderer.context.DEPTH_TEST);
  renderer.render( scene2, camera3 );
  renderer.clear(false, true, false);
  //renderer.context.enable(renderer.context.DEPTH_TEST);
  renderer.render( scene3, camera3 );
  renderer.autoClear = true;
  //t += elapsedTime / 10000;
  //console.log( renderer.info.render.calls );
  // There are currently 5 draw calls: colored lines of scene3, triangles and 3 spheres + cube... uh... that's six, maybe the count is reset between renderer calls

  elapsedTime = elapsedTime % fpsLimit;
}

requestAnimationFrame( animate );

