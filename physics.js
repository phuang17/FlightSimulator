/**
 * physics.js
 * 
 * @fileoverview Manages all physics related features, including forces, 
 *   displacements, and collision detection.
 * @author Po-Han Huang <phuang17@illinois.edu>
 */

/** Velocity of airplane */
var velocity = vec3.create();

/** Current thrust */
var thrust = 0;
/** Whether reverse thrust is turned on */
var reverse = false;
/** Whether airplane is on the ground (as opposed to being in the air). */
var ground = true;
/** Whether the game is stil playing (as opposed to gameover or winning). */
var playing = true;

/** Gravity */
var GRAVITY = 0.002;
/** Drag force coefficient (see getDragForce()) */
var DRAG_FORCE_COEFF = 0.0883883;
/** Drag force power (see getDragForce()) */
var DRAG_FORCE_POWER = 1.5;
/** Drag force threshold (see getDragForce()) */
var DRAG_FORCE_THRESHOLD = 0.000001;
/** Lift force coefficient (see getLiftForce()) */
var LIFT_FORCE_COEFF = 0.1;
/** Lift force multipier according to pitch keypresses. (see getLiftForce()) */
var LIFT_PITCH_COEFF = [0.4,1.0,1.6];
/** Acceleration coefficient (see getThrustForce()) */
var ACCELERATION_COEFF = 1.2e-3;
/** Roll change rate in reponse to roll keypresses. */
var ROLL_CHANGE_RATE = 2.0e-3;
/** Yaw change rate in reponse to roll keypresses. */
var YAW_CHANGE_RATE = 0.1;

/** Velocity threshold to judge whether crashing on land. */
var CRASH_ON_LAND_VELOCITY_THRESHOLD = 0.025;
/** Pitch threshold to judge whether crashing on land. */
var CRASH_ON_LAND_PITCH_THRESHOLD = degToRad(20);
/** Roll threshold to judge whether crashing on land. */
var CRASH_ON_LAND_ROLL_THRESHOLD = degToRad(20);
/** Threshold to judge whether crashing into the mountains */
var CRASH_ON_MOUNTAIN_THRESHOLD = 0.01;
/** Threshold to judge whether crashing into the walls. */
var CRASH_ON_WALL_THRESHOLD = 0.1;

/** Initialization of hysics.js */
function physicsInit(){
  
}

/** Update physics data.
 *  @param {float} lapse timelapse since last frame in sec
 */
function physicsUpdate(lapse){

  physicsUpdatePosition(lapse);
  physicsUpdateVelocity(lapse);

  physicsCheckCrashes();
  physicsCheckGround();

  physicsUpdateRoll(lapse);
  physicsUpdateLookAt();
  
}

/** Update airplane location based on velocity.
 *  @param {float} lapse timelapse since last frame in sec
 */
function physicsUpdatePosition(lapse){
  var viewOriginChange = vec3.clone(velocity);
  vec3.scale(viewOriginChange, viewOriginChange, lapse);
  vec3.add(viewOrigin, viewOrigin, viewOriginChange);
}

/** Update airplane velocity based on forces.
 *  @param {float} lapse timelapse since last frame in sec
 */
function physicsUpdateVelocity(lapse){
  
  /** Apply lift force (along z-axis and left-right direction). */
  var liftVelocityChange = vec3.create();
  var liftDirection = vec3.fromValues(viewLookAt[0],viewLookAt[1],0.0);
  vec3.normalize(liftDirection, liftDirection);
  vec3.scale(liftDirection, liftDirection, vec3.dot(liftDirection, viewUp));
  vec3.subtract(liftDirection, viewUp, liftDirection);
  vec3.normalize(liftDirection, liftDirection);
  vec3.scale(liftVelocityChange, liftDirection, getLiftForce()*lapse);
  
  /** Apply thrust force (along lookAt direction). */
  var thrustVelocityChange = vec3.create();
  vec3.scale(thrustVelocityChange, viewLookAt, getThrustForce()*lapse);
  
  /** Apply drag force (along negative lookAt direction). */
  var dragVelocityChange = vec3.create();
  vec3.scale(dragVelocityChange, viewLookAt, -getDragForce()*lapse);
  
  /** Apply gravity (along z-axis). */
  velocity[2] -= GRAVITY * lapse;

  vec3.add(velocity, velocity, thrustVelocityChange);
  vec3.add(velocity, velocity, liftVelocityChange);
  vec3.add(velocity, velocity, dragVelocityChange);

}

/** Update lookAt direction to match velocity direction. */
function physicsUpdateLookAt(){

  /** Quaternion change to apply. */
  var quatChange = quat.create();
  /** Velocity direction. */
  var normalizedVelocity = vec3.create();

  /** Update only when velocity is not zero. */
  if(vec3.length(velocity) >= 0.000001){

    vec3.normalize(normalizedVelocity, velocity);

    /** If moving backwards, match lookAt to opposite of velocity direction. */
    if(vec3.dot(viewLookAt, normalizedVelocity) < 0){
      vec3.negate(normalizedVelocity, normalizedVelocity);
    }

    /** Apply quaternion change. */
    quat.rotationTo(quatChange, viewLookAt, normalizedVelocity);
    quat.multiply(viewQuat, quatChange, viewQuat);
    quat.normalize(viewQuat, viewQuat);

  }

  /** If on the ground, eliminate roll. */
  if(ground){
    vec3.transformQuat(viewUp, VIEW_UP_INIT, viewQuat);
    vec3.transformQuat(viewLookAt, VIEW_LOOKAT_INIT, viewQuat);
    vec3.transformQuat(viewRight, VIEW_RIGHT_INIT, viewQuat);
    quat.setAxisAngle(quatChange, viewLookAt, -getRoll());
    quat.multiply(viewQuat, quatChange, viewQuat);
    quat.normalize(viewQuat, viewQuat);
  }

}

/** Check if airplane is on the ground. */
function physicsCheckGround(){

  /** If was on the ground... */
  if(ground){

    /** If vertical velocity is positive (i.e. gravity is overcome), fly! */
    if(velocity[2] > 0.0){
      ground = false;
    }else 
    /** If airplane is still on the land, clear vertical velocity and set
     *    airplane location right on the ground (not under the ground).
     */
    if(physicsCheckAboveLand()){
      velocity[2] = 0;
      viewOrigin[2] = AIRPLANE_HEIGHT;
    }else
    {
      /** If airplane is NOT on the land, fall into the ocean. */
      ground = false;
    }

  }else{

    /** If was in the air, check if airplane has landed. */
    if(physicsCheckAboveLand() && viewOrigin[2] <= AIRPLANE_HEIGHT){
      velocity[2] = 0;
      viewOrigin[2] = AIRPLANE_HEIGHT;
      ground = true;
    }

  }
}

/** Helper functino to check whether airplane is above the land or above the 
 *    ocean.
 */
function physicsCheckAboveLand(){
  return viewOrigin[0] >= -1.0 && viewOrigin[0] < 1.0 && viewOrigin[1] >= -1.0 && viewOrigin[1] < 1.0;
}

/** Check if gameover or winning. */
function physicsCheckCrashes(){
  physicsCheckCrashOcean();
  physicsCheckCrashLand();
  physicsCheckCrashMountain();
  physicsCheckCrashWall();
  physicsCheckCrashObstacle();
  physicsCheckNoFuel();
  physicsCheckWin();
}

/** Check if airplane crashes into ocean. */
function physicsCheckCrashOcean(){
  if(!physicsCheckAboveLand() && (viewOrigin[2] <= 0.0 || airplaneTip[2] <= 0.0)){
    viewOrigin[2] = AIRPLANE_HEIGHT;
    gameover("GAMEOVER! You crashed into the ocean. Press R to restart.");
  }
}

/** Check if airplane crashes on land. */
function physicsCheckCrashLand(){
  if(ground === false && viewOrigin[2] <= AIRPLANE_HEIGHT && 
      (velocity[2] <= -CRASH_ON_LAND_VELOCITY_THRESHOLD || 
        Math.abs(getRoll()) >= CRASH_ON_LAND_ROLL_THRESHOLD || 
        Math.abs(getPitch()) >= CRASH_ON_LAND_PITCH_THRESHOLD ) ){
    gameover("GAMEOVER! You crashed on land. Press R to restart.");
  }
}

/** Check if airplane crashes into mountains. */
function physicsCheckCrashMountain(){
  if(terrainReady && physicsCheckAboveLand()){

    /** Distance between adjacent terrain vertices */
    var stride = 2.0 / (TERRAIN_SIZE - 1);
    /** Row and column index airplane is at */
    var col = Math.floor((airplaneTip[0] + 1.0) / stride);
    var row = Math.floor((airplaneTip[1] + 1.0) / stride);
    /** X and Y distances to vertex */
    var dx = (airplaneTip[0] + 1.0) / stride - col;
    var dy = (airplaneTip[1] + 1.0) / stride - row;

    /** Calculate the height of terrain where airplane is at. */
    var gradientX;
    var gradientY;
    var z;

    /** Check lower or upper triangle. */
    if(dx + dy <= 1.0){
      gradientX = terrainPositionArray[terrainIndex(row, col+1) + 2] - terrainPositionArray[terrainIndex(row, col) + 2];
      gradientY = terrainPositionArray[terrainIndex(row+1, col) + 2] - terrainPositionArray[terrainIndex(row, col) + 2];
      z = terrainPositionArray[terrainIndex(row, col) + 2] + dx * gradientX + dy * gradientY;
    }else{
      gradientX = terrainPositionArray[terrainIndex(row+1, col+1) + 2] - terrainPositionArray[terrainIndex(row+1, col) + 2];
      gradientY = terrainPositionArray[terrainIndex(row+1, col+1) + 2] - terrainPositionArray[terrainIndex(row, col+1) + 2];
      z = terrainPositionArray[terrainIndex(row+1, col+1) + 2] + (1.0 - dx) * gradientX + (1.0 - dy) * gradientY;
    }

    /** Check if airplane is below terrain. */
    if(airplaneTip[2] < z - CRASH_ON_MOUNTAIN_THRESHOLD){
      gameover("GAMEOVER! You crashed into the mountains. Press R to restart.");
    }
  }
}

/** Check if airplane tries to bypass mountains. */
function physicsCheckCrashWall(){
  if(( viewOrigin[0] < -(1.0 + CRASH_ON_WALL_THRESHOLD) || 
       viewOrigin[0] > 1.0 + CRASH_ON_WALL_THRESHOLD ) 
       && viewOrigin[1] < 0.0 && airplaneTip[1] > 0.0){
    gameover("GAMEOVER! You cannot fly by the mountains. Press R to restart.");
  }
}

/** Check if airplane crashes into obstacles. */
function physicsCheckCrashObstacle(){

  /** Check only when obstacles are enabled. */
  if(obstacleLevel !== 0){

    var collision = false;

    /** Iterate through all obstacles. */
    for(var i = 0; i < OBSTACLE_COUNT; i++){

      /** Assume obstacle is cylinder with radius r and height h. */
      var r = 0.3 * OBSTACLE_SCALE[0];
      var h = 1.1 * OBSTACLE_SCALE[1];
      /** Location of obstacle */
      var o = vec3.clone(obstacleOrigin[i]);
      /** Get the two center coordinates of the two bottoms of cylinder. */
      var angle = obstacleAngle[i];
      var a = vec3.fromValues(o[0] - h * Math.sin(angle), o[1] + h * Math.cos(angle), o[2]);
      var b = vec3.fromValues(o[0] + h * Math.sin(angle), o[1] - h * Math.cos(angle), o[2]);
      /** Get coordinates of airplane tip. */
      var x = vec3.clone(airplaneTip);

      /** Check if x is in the cylinder. */
      var ba = vec3.create();
      vec3.subtract(ba, b, a);
      vec3.normalize(ba, ba);
      var xa = vec3.create();
      vec3.subtract(xa, x, a);
      var d = vec3.create();
      vec3.cross(d, xa, ba);

      if(vec3.dot(xa,ba) > 0 && vec3.dot(xa,ba) < h*2 && vec3.length(d) < r){
        collision = true;
      }

    }

    /** If there is collision, gameover. */
    if(collision){
      gameover("GAMEOVER! You crashed into another aircraft. Press R to restart.");
    }
  }
}

/** Check if timeout. */
function physicsCheckNoFuel(){
  if(Date.now() - startTime >= TIMEOUT){
    gameover("GAMEOVER! You ran out of fuel. Press R to restart.");
  }
}

/** Check if wins. */
function physicsCheckWin(){
  if(ground && viewOrigin[0] >= -0.003 && viewOrigin[0] <= 0.003 
            && viewOrigin[1] >= 0.9 && viewOrigin[1] <= 1.0 
            && getHorizontalVelocity() <= 0.002){
    gameover("You WIN!!!!!!! Congratulations!");
  }
}

/** Update roll or yaw in reaction to keypresses. */
function physicsUpdateRoll(lapse){

  /** If in the air, modify roll. */
  if(!ground){
    var quatChange = quat.create();
    if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
      /** Roll leftwards when Left-arrow or A is pressed. */
      quat.setAxisAngle(quatChange, viewLookAt, -ROLL_CHANGE_RATE);
    } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
      /** Roll rightwards when Right-arrow or D is pressed. */
      quat.setAxisAngle(quatChange, viewLookAt, ROLL_CHANGE_RATE);
    } 
    quat.multiply(viewQuat, quatChange, viewQuat);
    quat.normalize(viewQuat, viewQuat);
  }else{
    /** If on the ground, modify yaw. */
    if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
      /** Turn left when Left-arrow or A is pressed. */
      vec3.rotateZ(velocity, velocity, vec3.create(), YAW_CHANGE_RATE*lapse);
    } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
      /** Turn rigt when Right-arrow or D is pressed. */
      vec3.rotateZ(velocity, velocity, vec3.create(), -YAW_CHANGE_RATE*lapse);
    }
  }

}

/** Calculate lift force. 
 *  @return {float} liftForce
 */
function getLiftForce(){

  /** Lift force = KEY_COEFF * LIFT_FORCE_COEFF * horizontal velocity */

  if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
    /** More lift force when Up-arrow or W is pressed. */
    return LIFT_PITCH_COEFF[2] * LIFT_FORCE_COEFF * getHorizontalVelocity();
  }else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
    /** Less lift force when Down-arrow or S is pressed. */
    return LIFT_PITCH_COEFF[0] * LIFT_FORCE_COEFF * getHorizontalVelocity();
  }else{
    /** Default lift force. */
    return LIFT_PITCH_COEFF[1] * LIFT_FORCE_COEFF * getHorizontalVelocity();
  }

}

/** Calculate thrust force. 
 *  @return {float} thrustForce
 */
function getThrustForce(){

  /** Thrust force = thrust * ACCELERATION_COEFF */

  return thrust * ACCELERATION_COEFF;
}

/** Calculate drag force. 
 *  @return {float} dragForce
 */
function getDragForce(){

  /** Drag force = DRAG_FORCE_COEFF * (velocity)^(DRAG_FORCE_POWER) */

  /** If velocity if too small, no drag force. */
  if(vec3.length(velocity) > DRAG_FORCE_THRESHOLD){
    return DRAG_FORCE_COEFF * Math.pow(vec3.length(velocity), DRAG_FORCE_POWER);
  }else{
    return 0;
  }
}

