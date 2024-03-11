/**
 * Random worker
 */

'use strict'

//console.log('Worker Random starting');

onmessage = function( event ) {
  console.log( 'Worker thread "random" received main thread message: ' );
  console.log( event );
  switch( event.data ) {
    case 'texture':
      console.log( 'texture wanted' );
      generateTexture( 256 );
      break;
    default:
      break;
  }
};

let i = 0;

function heartbeat() {
  i = i + 1;
  postMessage( [ 'heartbeat', i ] );
  setTimeout( heartbeat, 10000 );
}

//heartbeat();

// Pick the 8 prime numbers just below 65535 (as close as possible to max out 16 bits value)
let aPermutationTableSizes = [ 65419, 65423, 65437, 65447, 65449, 65479, 65497, 65521 ];
var auint16PermutationTables = [];

function init() {

  // Create the permutation tables
  for( let i = 0; i < aPermutationTableSizes.length; i++ ) {
    auint16PermutationTables[i] = new Uint16Array( aPermutationTableSizes[i] );
  }

  for( let i = 0; i < aPermutationTableSizes.length; i++ ) {

    // Initialize the initial permutation table elements, each element pointing to the next one
    for( let e = 0; e < aPermutationTableSizes[i] - 1; e++ ) {
      auint16PermutationTables[i][e] = e+1;
    }
    // Close the loop by pointing the last element to the first one
    auint16PermutationTables[i][aPermutationTableSizes[i] - 1] = 0;
    
    // Flush the table by executing a number of permutations equal to twice the table size
    for( let p = 0; p < aPermutationTableSizes[i]*2; p++ ) {
      // Get two random elements
      // TODO - this needs to be replaced by a reproducable generator, like a simpe linear congruential generator
      let startElement1 = Math.floor( Math.random() * aPermutationTableSizes[i] );
      let startElement2 = Math.floor( Math.random() * aPermutationTableSizes[i] );
      // Make sure the 2 triplets don't overlap
      if( startElement1 == startElement2 ) continue;
      let middleElement1 = auint16PermutationTables[i][startElement1];
      let middleElement2 = auint16PermutationTables[i][startElement2];
      if( startElement1 == middleElement2 || startElement2 == middleElement1 ) continue;
      let endElement1 = auint16PermutationTables[i][middleElement1];
      let endElement2 = auint16PermutationTables[i][middleElement2];
      if( startElement1 == endElement2 || startElement2 == endElement1 ) continue;
      // Branch the sequence
      auint16PermutationTables[i][startElement1] = middleElement2;
      auint16PermutationTables[i][startElement2] = middleElement1;
      auint16PermutationTables[i][middleElement1] = endElement2;
      auint16PermutationTables[i][middleElement2] = endElement1;
    }
    // Initialize the next table with the current one - can't do that -> not the same size
    // auint16PermutationTables[i+1] = [...auint16PermutationTables[i]];
  }

  console.log( auint16PermutationTables );

  // Test the permutation table
  /*let aPermutationCounts = [];
  let iTestElement = 0;
  for( let i = 0; i < PERMUTATION_TABLE_SIZE; i++ ) {
    aPermutationCounts[i] = 0;
  }
  iTestElement = 0;
  for( let i = 0; i < PERMUTATION_TABLE_SIZE; i++ ) {
    aPermutationCounts[iTestElement] ++;
    iTestElement = aPermutations[iTestElement];
  }
  for( let i = 0; i < PERMUTATION_TABLE_SIZE; i++ ) {
    if( aPermutationCounts[i] != 1 ) console.log( 'error on element ' + i );
  }
  console.log( aPermutationCounts );*/
}

init();


// Function generating a texture with random pixels
function generateTexture( size ) {
  // create a buffer with color and transparency data

  var data = new Uint8Array( 4 * size * size );
  var iElement = 0;

  for ( var i = 0; i < size * size; i ++ ) {

    var stride = i * 4;

    data[ stride ] = Math.floor( iElement );
    iElement = auint16PermutationTables[0][iElement];
    data[ stride + 1 ] = Math.floor( iElement );
    iElement = auint16PermutationTables[0][iElement];
    data[ stride + 2 ] = Math.floor( iElement );
    iElement = auint16PermutationTables[0][iElement];
    data[ stride + 3 ] = 0;
  }

  // used the buffer to create a DataTexture

  //var texture = new THREE.DataTexture( data, size, size, THREE.RGBAFormat );

  postMessage( [ 'texture', data.buffer ], [ data.buffer ] );
}
