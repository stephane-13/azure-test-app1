/**
 * Vehicle management
 * @module Vehicle
 */

'use strict'

import * as THREE from 'three';
import { Mathx } from "./mathx.js";
import { Thruster } from "./thruster.js";
import { Keystate, Mousestate } from "./input.js";
import { damp } from 'three/src/math/MathUtils.js';

/** 
 * @exports Vehicle
 */
export { Vehicle };

/**
 * @class Object used to handle vehicles
 */
class Vehicle extends THREE.Object3D {

  /**
  * @constructor
  * @param {THREE.Vector3} position
  */
  constructor( position ) {

    super();

    this.position.copy( position );                                  // Ship position
    this.playerPosition      = new THREE.Vector3( 0, 0, 0 );         // Player position relative to the geometry origin

    this.mass                = 1000;                                 // Ship mass in kg
    this.momentOfInertia     = 1000;                                 // Ship moment of interia in kg·m² (for center of mass, axis undefined - TODO: compute real value)
    this.speed               = new THREE.Vector3( 0, 0, 0 );         // Ship speed in m/s
    this.acceleration        = new THREE.Vector3( 0, 0, 0 );         // Ship acceleration in m/s²
    this.angularMomentum     = new THREE.Vector3( 0, 0, 0 );         // Ship angular speed in s⁻¹
    this.angularAcceleration = new THREE.Vector3( 0, 0, 0 );         // Ship angular acceleration in s⁻²

    /** @type {Thruster[]} */
    this.thrusters = [];
    //this.lastThrustersProcessingTime = -1;

    this.dampRotation = true;
  }

  /**
   * Function used to add an thruster
  * @param {string}        keyCode          The key code that will trigger this thruster
  * @param {THREE.Vector3} position         The key code that will trigger this thruster
  * @param {THREE.Vector3} direction        Direction of the thrust of the thruster (must be a THREE.Vector3 unit vector)
  * @param {number}        thrustChangeRate Thurst change rate in N/s
  * @param {number}        maxThrust        Maximum thrust in N
  */
  addThruster( keyCode, position, direction, thrustChangeRate, maxThrust ) {
    let thruster = new Thruster( keyCode, position, direction, thrustChangeRate, maxThrust );
    this.thrusters.push( thruster );
    // Update the torque control parameters
    this.computeRotationDampingParameters();
  }

  /**
  * Function calculating linear and angular acceleration of the vehicle
  * @param {number}        time             The processing time
  * @param {Keystate}      keystate         The key states object
  * @param {Mousestate}    mousestate       The mouse state object
  */
  processThrusters( elapsedTime, keystate, mousestate ) {

    // If this is the first call, let's assume an elapsed time interval of 30ms
    /*if( this.lastThrustersProcessingTime == -1 ) {
      this.lastThrustersProcessingTime = time - 30;
    }*/

    // Calculate the elapsed time since last processing
    //let elapsedTime = time - this.lastThrustersProcessingTime;

    // Start calculations with zero linear and angular accelerations
    this.acceleration.set( 0, 0, 0 );
    this.angularAcceleration.set( 0, 0, 0 );

    // Loop on vehicle thrusters
    for( let e = 0; e < this.thrusters.length; e++ ) {

      // Update the thruster powered status based on the corresponding key status
      // TODO - make the mouse speed control the thruster power, not just on/off
      if( keystate.isPressed( this.thrusters[e].keyCode ) || mousestate.isMoving( this.thrusters[e].keyCode ) ) {
        this.thrusters[e].powered = true;
      } else {
        this.thrusters[e].powered = false;
      }

      // Update thruster thrust
      this.thrusters[e].process( elapsedTime );

      // Now that we have the updated thrust, add it to the ship total acceleration
      this.acceleration.addScaledVector( this.thrusters[e].direction, this.thrusters[e].thrust / this.mass );
  
      // And do the same for the torque and angular acceleration
      this.angularAcceleration.addScaledVector( this.thrusters[e].maxTorque, this.thrusters[e].thrust / ( this.thrusters[e].maxThrust * this.momentOfInertia ) );
    }

    // Convert the total acceleration from local to world coordinate system (v_world = q · v_local · q*)
    this.acceleration.applyQuaternion( this.quaternion );
    // If no thruster is powered, we need to damp the movement by enabling thrusters to oppose speed
    // TODO: how to identify the thruster(s) that can dampen the exisitng movement?
    // Answer: we need to use matrix triangulation to find how to oppose speed with the thrusters that we have

    // For now: just add an opposite fraction of the speed
    // TODO - this should at least be handled by axis (x,y,z,rx,ry,rz)
    if( this.acceleration.x == 0 && this.acceleration.y == 0 && this.acceleration.z == 0 ) {
      //console.log ( "Damping angular speed" );
      let dampeningFactor = elapsedTime * 1.0 * this.speed.length() + 1;
      this.acceleration.addScaledVector( this.speed, - dampeningFactor );
    }
    // Compute the speed from the acceleration
    this.speed.addScaledVector( this.acceleration, elapsedTime );

    // Compute the position from the speed  
    this.position.addScaledVector( this.speed, elapsedTime );

    // Convert the total angular acceleration to the world coordinate system
    this.angularAcceleration.applyQuaternion( this.quaternion );
    // If no thruster is powered, we need to damp the movement by enabling thrusters to oppose angular speed
    // TODO: how to identify the thruster(s) that can dampen the exisitng movement?

    // For now: just add an opposite fraction of the angular speed
    if( this.angularAcceleration.x == 0 && this.angularAcceleration.y == 0 && this.angularAcceleration.z == 0 ) {
      //console.log ( "Damping angular speed" );
      let dampeningFactor = elapsedTime * 1.0 * this.angularMomentum.length() + 1;
      this.angularAcceleration.addScaledVector( this.angularMomentum, - dampeningFactor );
    }
    // Compute the angular momentum
    this.angularMomentum.addScaledVector( this.angularAcceleration, elapsedTime );

    // Compute the angular position quaternion (angular speed * time), and also add the 0.5 factor needed below
    let newQuaternion = new THREE.Quaternion().set(
      this.angularMomentum.x * 0.5 * elapsedTime,
      this.angularMomentum.y * 0.5 * elapsedTime,
      this.angularMomentum.z * 0.5 * elapsedTime,
      0
    );

    // Calculate the final quaternion q1 from the original quaternion q0 and the angular velocity quaternion w (q1 = q0 + 0.5 · w · q0)
    newQuaternion.multiply( this.quaternion );
    this.quaternion.set( this.quaternion.x + newQuaternion.x, this.quaternion.y + newQuaternion.y, this.quaternion.z + newQuaternion.z, this.quaternion.w + newQuaternion.w );

    // Normalization is not mathematically needed, but it ensures that limited precision float calculations don't distort the unit quaternion over time
    this.quaternion.normalize();

    //this.lastThrustersProcessingTime = time;
  }

  computeRotationDampingParameters() {
    // Note: this calculus is only needed if something changes with the thrusters (damage, vehicle modification, ...)
    // Take thrusters associated with MouseRight, MouseUp and KeyE and convert their thrust (direction) vector to unit vectors
    // Ideally, we would process any triplet of thrusters and choose the one maximizing the matrix determinant
    let bestThrustersSet = [ -1, -1, -1 ];
    let bestDeterminant = 0;
    let bestTorqueMatrix;
    for( let e1 = 0; e1 < this.thrusters.length; e1++ ) {
      // If the torque of the thruster is pretty much null, skip it
      if( this.thrusters[e1].maxTorque.length() < 0.1 ) continue
      for( let e2 = 0; e2 < this.thrusters.length; e2++ ) {
        // If the torque of the thruster is pretty much null, skip it
        if( this.thrusters[e2].maxTorque.length() < 0.1 ) continue
        for( let e3 = 0; e3 < this.thrusters.length; e3++ ) {
          // If the torque of the thruster is pretty much null, skip it
          if( this.thrusters[e3].maxTorque.length() < 0.1 ) continue
          // Now that we have 3 thrusters with enough torque, let's compute the matrix determinant
          //console.log( e1,e2,e3 );
          let torqueMatrix = new THREE.Matrix3().set(
            this.thrusters[e1].maxTorque.x, this.thrusters[e2].maxTorque.x, this.thrusters[e3].maxTorque.x,
            this.thrusters[e1].maxTorque.y, this.thrusters[e2].maxTorque.y, this.thrusters[e3].maxTorque.y,
            this.thrusters[e1].maxTorque.z, this.thrusters[e2].maxTorque.z, this.thrusters[e3].maxTorque.z,
          );
          if( Math.abs( torqueMatrix.determinant() ) > bestDeterminant ) {
            bestThrustersSet = [ e1, e2, e3 ];
            bestTorqueMatrix = torqueMatrix;
          }
        }
      }
    }
    // Make sure they form a matrix with a non zero determinant
    if( bestThrustersSet[0] == -1 ) {
      console.log( "Can't find thrusters configuration usable to control torque" );
      return;
    }
    console.log( 'Best thrusters set for torque control:' );
    console.log( bestThrustersSet );
    console.log( this.thrusters[bestThrustersSet[0]].keyCode, this.thrusters[bestThrustersSet[1]].keyCode, this.thrusters[bestThrustersSet[2]].keyCode );
    console.log( bestDeterminant );
    console.log( bestTorqueMatrix );
    // Inverse the matrix
    // Convert the current angular momentum in that thrusters base using the inverse matrix
    // Scale the resulting opposing angular momentum to a fraction of the angular momentum to cancel
    // Compute the thrust needed to produce the needd momentum for each thruster
    // If the thurst is too high for any of the egnine, scale all thrusts to the maximum possible value that doesn't exceed the thruster capabilities
  }

}
