/**
 * view.js
 * 
 * @fileoverview Manages all vision features, including viewing parameters
 *   (eye coordinates, lookAt vector, up vector, view quaternion, pitch, roll, 
 *   yaw, viewing matrices) and lighting parameters.
 * @author Po-Han Huang <phuang17@illinois.edu>
 */

/** Initial eye height */
var AIRPLANE_HEIGHT = 0.0006;
/** Initial eye coordinates */
var viewOrigin = vec3.fromValues(0.0,-0.9,AIRPLANE_HEIGHT);
/** Coordinates of the tip of airplane */
var airplaneTip = vec3.clone(viewOrigin);

/** Up vector */
var viewUp = vec3.create();
/** LookAt vector */
var viewLookAt = vec3.create();
/** LookAt center */
var viewCenter = vec3.create();
/** Right vector */
var viewRight = vec3.create();

/** Viewing quaternion */
var viewQuat = quat.create();
/** Viewing matrix */
var mvMatrix = mat4.create();
/** Perspective projection matrix */
var pMatrix = mat4.create();

/** Unit vectors along each axis */
var X_AXIS = vec3.fromValues(1.0,0.0,0.0);
var Y_AXIS = vec3.fromValues(0.0,1.0,0.0);
var Z_AXIS = vec3.fromValues(0.0,0.0,1.0);

/** Initial viewing directions */
var VIEW_UP_INIT     = vec3.fromValues(0.0,0.0,1.0);
var VIEW_LOOKAT_INIT = vec3.fromValues(0.0,-1.0,0.0);
var VIEW_RIGHT_INIT  = vec3.fromValues(-1.0,0.0,0.0);

/** Field of view */
var VIEWPORT = 85;

/** Lighting parameters */
/** Parallel light source */
var LIGHT_DIRECTION = vec3.fromValues(Math.sin(degToRad(30))*Math.cos(degToRad(30)), 
                                      Math.sin(degToRad(30))*Math.sin(degToRad(30)), 
                                      Math.cos(degToRad(30)));
/** White lights for ambient and diffuse parts. */
var AMBIENT_LIGHT = vec3.fromValues(0.3, 0.3, 0.3);
var DIFFUSE_LIGHT = vec3.fromValues(0.6, 0.6, 0.6);
/** Specular light is soft warm sunlight (RGB = 253,184,19). */
var SPECULAR_LIGHT = vec3.fromValues(0.55*253/255, 0.55*184/255, 0.55*19/255);

/** Initialization of view.js */
function viewInit(){
  /** Generate perpective projection matrix. */
  mat4.perspective(pMatrix, degToRad(VIEWPORT), gl.viewportWidth / gl.viewportHeight, 0.0001, 10.0);
}

/** Update viewing vectors and matrices. */
function viewUpdateMatrix(){

  /** Update up, lookAt, and right vector based on current quat. */
  vec3.transformQuat(viewUp, VIEW_UP_INIT, viewQuat);
  vec3.transformQuat(viewLookAt, VIEW_LOOKAT_INIT, viewQuat);
  vec3.transformQuat(viewRight, VIEW_RIGHT_INIT, viewQuat);

  /** Update viewing matrix */
  vec3.add(viewCenter, viewOrigin, viewLookAt);
  mat4.lookAt(mvMatrix, viewOrigin, viewCenter, viewUp);

  /** Update airplane tip. */
  var offsetFront = vec3.create();
  var offsetUp = vec3.create();

  vec3.scale(offsetFront, viewLookAt, AIRPLANE_TIP_FRONT);
  vec3.scale(offsetUp, viewUp, AIRPLANE_TIP_UP);

  vec3.add(airplaneTip, viewOrigin, offsetFront);
  vec3.add(airplaneTip, airplaneTip, offsetUp);

}

/** Calculate current roll.
 *  @return {float} roll in rad
 */
function getRoll(){
  return vec3.angle(viewRight, Z_AXIS) - Math.PI / 2;
}

/** Calculate current pitch.
 *  @return {float} pitch in rad
 */
function getPitch(){
  return Math.PI / 2 - vec3.angle(viewLookAt, Z_AXIS);
}

/** Calculate current yaw.
 *  @return {float} yaw in rad
 */
function getYaw(){
   return angleNormalize(getOrientation() - getVelocityOrientation());
}

/** Calculate current lookAt orientation (with +y-axis being 0 and +x-axis being PI/2). 
 *  @return {float} looatAtOrientation in rad
 */
function getOrientation(){
  var orientation = vec3.fromValues(viewLookAt[0],viewLookAt[1],0);
  return angleNormalize(viewLookAt[0] < 0 ? -vec3.angle(orientation, Y_AXIS) : vec3.angle(orientation, Y_AXIS));
}

/** Calculate current velocity orientation (with +y-axis being 0 and +x-axis being PI/2). 
 *  @return {float} velocityOrientation in rad
 */
function getVelocityOrientation(){
  var orientation = vec3.fromValues(velocity[0],velocity[1],0);
  return angleNormalize(velocity[0] < 0 ? -vec3.angle(orientation, Y_AXIS) : vec3.angle(orientation, Y_AXIS));
}

/** Check if velocity is in opposite direction to lookAt. (Basically, whether  
 *    airplane is going backwards.)
 *  @return {boolean}
 */
function getIfVelocityOppositeToLookat(){
  var yaw = getYaw();
  return yaw > degToRad(90) || yaw < degToRad(-90);
}

/** Calculate horizontal velocity. 
 *  @return {float} horizontalVelocity
 */
function getHorizontalVelocity(){
  return Math.sqrt(velocity[0] * velocity[0] + velocity[1] * velocity[1]);
}

/** Helper function to make sure an angle falls within -PI to PI. 
 *  @param {float} angle in rad
 *  @return {float} angle in rad
 */
function angleNormalize(angle){
  if(angle > degToRad(180)){
    angle -= Math.PI * 2;
  }else if(angle <= degToRad(-180)){
    angle += Math.PI * 2;
  }
  return angle;
}


