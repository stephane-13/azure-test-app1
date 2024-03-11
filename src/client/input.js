/**
 * Input management
 */

'use strict'

import { renderer } from "./index.js";

export { Keystate, Mousestate };



class Mousestate {

   /**
   * Constructor for the Mousestate object, which creates the structure to store the pointer state
   * and starts the listeners on mousemove events
   * @property {object} mousestate pointer state dictionary
   */
  constructor() {
    this.mousestate = {
      x          : 0,
      y          : 0,
      deltax     : 0,
      deltay     : 0,
      MouseUp    : false,
      MouseDown  : false,
      MouseLeft  : false,
      MouseRight : false,
    };
    let Mousestate = this;

    document.addEventListener( 'mousemove', function( event ) {
      Mousestate.mousestate.x = event.clientX;
      Mousestate.mousestate.y = event.clientY;
      Mousestate.mousestate.deltax += event.movementX;
      Mousestate.mousestate.deltay += event.movementY;

      if( Mousestate.mousestate.deltax <= -1 ) {
        Mousestate.mousestate.MouseLeft = true;
        Mousestate.mousestate.MouseRight = false;
      } else if( Mousestate.mousestate.deltax >= 1 ) {
        Mousestate.mousestate.MouseLeft = false;
        Mousestate.mousestate.MouseRight = true;
      } else {
        Mousestate.mousestate.MouseLeft = false;
        Mousestate.mousestate.MouseRight = false;
      }

      if( Mousestate.mousestate.deltay <= -1 ) {
        Mousestate.mousestate.MouseUp = false;
        Mousestate.mousestate.MouseDown = true;
      } else if( Mousestate.mousestate.deltay >= 1 ) {
        Mousestate.mousestate.MouseUp = true;
        Mousestate.mousestate.MouseDown = false;
      } else {
        Mousestate.mousestate.MouseUp = false;
        Mousestate.mousestate.MouseDown = false;
      }
    });
 
    document.addEventListener( 'mousedown', function( event ) {
      if( document.pointerLockElement === null ) {
        renderer.domElement.requestPointerLock();
        console.log( 'pointer lock requested' );
      }
    });
    
    document.addEventListener('pointerlockchange', function( event ) {
      // Was the pointer unlocked?
      if( document.pointerLockElement === null ) {
        console.log( 'Mouse pointer unlocked' );
      // Mouse pointer has just been locked
      } else {
        console.log( 'Mouse pointer locked' );
      }
    });

  }

  /**
  * Returns the status of the mouse pointer on the specified axis
  * @param   {string}  direction - The mouse direction to query (MouseUp, MouseDown, MouseLeft, MouseRight)
  * @returns {boolean}             Returns true if the mouse pointer is moving in the specified direction or false if it isn't
  */
  isMoving( direction ) {
    return( this.mousestate[direction] );
  }

  /**
  * Reduce recorded mouse relative movement
  * @returns {void}
  */
  settleMouse() {
    this.mousestate.deltax = 0;
    this.mousestate.deltay = 0;
    this.mousestate.MouseLeft = false;
    this.mousestate.MouseRight = false;
    this.mousestate.MouseUp = false;
    this.mousestate.MouseDown = false;
  }

}


/**
 * Keystate is an object to track the keys status
 * @property {object} keystate key states dictionary
 */
class Keystate {

   /**
   * Constructor for the Keystate object, which creates the structure to store the key states
   * and starts the listeners on keydown and keyup events.
   * @property {object} keystate key states dictionary
   */
  constructor() {
    this.keystate = {};
    let Keystate = this;

    document.addEventListener( 'keydown', function( event ) {
      if( Keystate.keystate[event.code] === undefined ) Keystate.init( event.code );
      // keydown events are repeated (keyboard repetition) and we don't want to update the lastChange time with repetitions
      if( ! Keystate.keystate[event.code].pressed ) {
        Keystate.keystate[event.code].pressed = true;
        Keystate.keystate[event.code].lastChange = new Date().getTime();
      }
      //console.log( event.code );
      if( Keystate.isPressed( 'Backquote' ) ) Keystate.toggleFullscreen( renderer.domElement );
    });
    
    document.addEventListener( 'keyup', function( event ) {
      if( Keystate.keystate[event.code] === undefined ) Keystate.init( event.code );
      // Normally keydown events are not repeated... but this is just in case
      if( Keystate.keystate[event.code].pressed ) {
        Keystate.keystate[event.code].pressed = false;
        Keystate.keystate[event.code].lastChange = new Date().getTime();
      }
    });
  }

  /**
  * Initialize a keycode object
  * @param {string} keyCode - The key code object to initialize
  */
  init( keyCode ) {
    this.keystate[keyCode] = {};
    this.keystate[keyCode].pressed = false;
    this.keystate[keyCode].lastChange = -1;
    this.keystate[keyCode].lastProcessed = -1;
  }
 
  /**
  * Returns the status of the corresponding key
  * @param   {string}  keyCode - The keycode to query
  * @returns {boolean}           Returns true is the key is pressed and false if it isn't
  */
  isPressed( keyCode ) {
    if( this.keystate[keyCode] === undefined ) this.init( keyCode );
    return( this.keystate[keyCode].pressed );
  }

  /**
  * Returns the last time the corresponding key was set as processed
  * @param   {string}  keyCode - The keycode to query
  * @returns {number}           Returns the unix timestamp of the last call to setLastProcessed for the corresponding key
  */
  getLastProcessed( keyCode ) {
    if( this.keystate[keyCode] === undefined ) this.init( keyCode );
    return( this.keystate[keyCode].lastProcessed );
  }

  /**
  * Sets the corresponding key as last processed at the specified time
  * @param   {string}  keyCode - The keycode to update
  * @param   {number}  time    - The time to set
  */
  setLastProcessed( keyCode, time ) {
    if( this.keystate[keyCode] === undefined ) this.init( keyCode );
    this.keystate[keyCode].lastProcessed = time;
  }

  /**
  * Returns the last time the corresponding key state changed
  * @param   {string}  keyCode - The keycode to query
  * @returns {number}            Returns the unix timestamp of the last call to setLastProcessed for the corresponding key
  */
  getLastChange( keyCode ) {
    if( this.keystate[keyCode] === undefined ) this.init( keyCode );
    return( this.keystate[keyCode].lastChange );
  }

  /**
  * Sets the corresponding key state as last changed at the specified time
  * @param   {string}  keyCode - The keycode to update
  * @param   {number}  time    - The time to set
  */
  setLastChange( keyCode, time ) {
    if( this.keystate[keyCode] === undefined ) this.init( keyCode );
    this.keystate[keyCode].lastChange = time;
  }


  /**
  * Toggles fullscreen on / off
  * @param {node} element - The html element to promote to fullscreen (usually, the WebGL renderer)
  */
  toggleFullscreen( element ) {
    // Note: the alert message about fullscreen can be disabled in firefox by setting:
    // full-screen-api.warning.delay = -1
    // full-screen-api.warning.warning = -1
    if( ! document.fullscreenElement ) {
      element.requestFullscreen().catch( err => {
        console.log( `Error attempting to enable full-screen mode: ${err.message} (${err.name})` );
      } );
      console.log( 'Fullscreen enabled.' );
    } else {
      document.exitFullscreen();
      console.log( 'Fullscreen disabled.' );
    }
  }

}
