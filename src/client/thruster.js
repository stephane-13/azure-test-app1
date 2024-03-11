/**
 * Thruster management
 * @module Thruster
 */

'use strict'

import * as THREE from 'three';

/** 
 * @exports Thruster
 */
export { Thruster };

/**
 * @class Object used to handle thrusters
 */
class Thruster {

  /**
  * @constructor
  * @param {string}        keyCode          The key code that will trigger this thruster
  * @param {THREE.Vector3} position         The key code that will trigger this thruster
  * @param {THREE.Vector3} direction        Direction of the thrust of the thruster (must be a THREE.Vector3 unit vector)
  * @param {number}        thrustChangeRate Thurst change rate in N/s
  * @param {number}        maxThrust        Maximum thrust in N
  */
  constructor( keyCode, position, direction, thrustChangeRate, maxThrust ) {

    this.keyCode          = keyCode;
    this.position         = position;
    this.direction        = direction;
    this.thrustChangeRate = thrustChangeRate;
    this.maxThrust        = maxThrust;
    this.maxTorque        = this.getTorque();
    
    this.powered = false;          // State of the thruster: on or off, as boolean
    this.thrust = 0;               // Current thrust in N
  }


  /**
   * Function returning the maximum torque of the thruster based on its position (compared to gravity center) and direction/thrust
   * @returns {THREE.Vector3} The maximum torque that the thruster can produce as a vector, which length is in N·m
   */
  getTorque() {
    return new THREE.Vector3().crossVectors( this.position, this.direction ).multiplyScalar( this.maxThrust );
  }

  /**
   * Function called to update the thruster thrust
   * @param {number} time
   */
  process( elapsedTime ) {

    if( this.thrust == 0 && ! this.powered ||
        this.thrust == this.maxThrust && this.powered
    ) {
      // Thruster is either 100% and powered, or 0% and unpowered, nothing to do

    } else if( this.thrust > 0 && ! this.powered ) {
      this.thrust -= this.thrustChangeRate * elapsedTime;
      if( this.thrust < 0 ) this.thrust = 0;

    } else if( this.thrust < this.maxThrust && this.powered ) {
      this.thrust += this.thrustChangeRate * elapsedTime;
      if( this.thrust > this.maxThrust ) this.thrust = this.maxThrust;

    } else {
      console.log( 'Oops - thruster in unknown state' );
    }

  }

}
