/**
 * Universe worker
 */

'use strict'

//import { Object3D, Vector3 } from "three";
import * as THREE from 'three';

//console.log('Worker Universe starting');

/**
 * @param {Number} x The cell x coordinate
 * @param {Number} y The cell y coordinate
 * @param {Number} z The cell z coordinate
 */
function universeCell( x,y,z ) {
  this.position = new THREE.Vector3( x,y,z );
  this.segments = [];
  /**
   * @param {Array} segments The segments array for the cell
   */
  this.generate = function( segments ) {
    for( let i = 0; i < Math.random(10); i++ ) {
      let x1 = Math.random();
      let y1 = Math.random();
      let z1 = Math.random();
      let x2 = Math.random();
      let y2 = Math.random();
      let z2 = Math.random();
      segments.push( [new THREE.Vector3( x1,y1,z1 ), new THREE.Vector3( x2,y2,z2 ) ] )
    }
  }
  this.generate( this.segments );
}

//var i = 0;

var universeCells = {};

onmessage = function( event ) {
  switch( event.data[0] ) {
    case 'shared_buffer':
      console.log( 'Universe: shared buffer received' );
      break;
    case 'generate':
      console.log( 'Universe: generate message received' );
      generateUniverseCells( event.data[1] );
      break;
    default:
      console.log( 'Universe: unknonw message "' + event.data[0] + '" received' );
  }
}

/**
 * @function heartbeat A simple heartbeat function communicaing with the main thread
 */
/*function heartbeat() {
  i = i + 1;
  postMessage( [ 'heartbeat', i ] );
  setTimeout( heartbeat, 10000 );
}*/

//heartbeat();

/**
 * @param {THREE.Vector3} position The cell coordinates to render
 */
function generateUniverseCells( position ) {
  // Check if some cells must be purged based on the new position
  // Loop on existing cells
  for( let x in universeCells ) {
    for( let y in universeCells) {
      for( let z in universeCells) {

      }
    }
  }

  let newcells = 0;
  // Loop on center and 26 adjacent cells
  for( let x = -1 + position.x; x <= 1 + position.x; x++ ) {
    if( ! ( x in universeCells ) ) universeCells[x] = {};
    for( let y = -1 + position.y; y <= 1 + position.y; y++ ) {
      if( ! ( y in universeCells[x] ) ) universeCells[x][y] = {};
      for( let z = -1 + position.z; z <= 1 + position.z; z++ ) {
        if( ! ( z in universeCells[x][y] ) ) {
          universeCells[x][y][z] = new universeCell( x, y, z );
          newcells++;
        }
      }
    }
  }
  console.log( newcells );
}

/*function benchmarkNumber() {
  let x = 1;
  let startTime = Date.now();
  for( let i = 0; i < 1e8; i++ ) {
    x = 0.1 + x;
    x = 0.1 + x;
    x = 0.1 + x;
    x = 0.1 + x;
    x = 0.1 + x;
    x = 0.1 + x;
    x = 0.1 + x;
    x = 0.1 + x;
    x = 0.1 + x;
    x = 0.1 + x;
  }
  console.log( 'Number:' + ( Date.now() - startTime ) + ' ms' );
}

benchmarkNumber();

function benchmarkBigInt() {
  let x = 1n;
  let startTime = Date.now();
  for( let i = 0; i < 1e8; i++ ) {
    x = 1n + x;
    x = 1n + x;
    x = 1n + x;
    x = 1n + x;
    x = 1n + x;
    x = 1n + x;
    x = 1n + x;
    x = 1n + x;
    x = 1n + x;
    x = 1n + x;
  }
  console.log( 'BigInt:' + ( Date.now() - startTime ) + ' ms' );
}

benchmarkBigInt();*/
