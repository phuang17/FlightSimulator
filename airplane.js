/**
 * airplane.js
 * 
 * @fileoverview Manages buffers, arrays, and other data related to airplane 
 *   models and obstacles. In this file, "airplane" refers to the airplane right
 *   in front of the viewport, whereas "obstacles" refer to the airplanes flying
 *   in the mid-air as obstacles.
 * @author Po-Han Huang <phuang17@illinois.edu>
 */

/** Identification prefix for airplane shader. */
var AIRPLANE_PREFIX = "airplane";

/** GL buffers for airplanes. */
var airplanePositionBuffer;
var airplaneIndexBuffer;
var airplaneColorBuffer;
var airplaneNormalBuffer;

/** Data array for airplanes. */
var airplanePositionArray = [];
var airplaneIndexArray = [];
var airplaneColorArray = [];
var airplaneNormalArray = [];

/** Shader program for airplanes. */
var airplaneShaderProgram;
/** Variable locations in shader program. */
var airplaneLocations = {};

/** Model-to-world matrix of the airplane. */
var airplaneModelMatrix = mat4.create();

/** Airplane body color */
var AIRPLANE_BODY_COLOR = [1.1,1.1,1.1];

/** Model-to-World scale of airplane */
var AIRPLANE_SCALE = vec3.fromValues(0.0004,0.0004,0.0004);
/** Vertical offset of airplane from view origin */
var AIRPLANE_OFFSET_UP = -0.0004;
/** Frontal offset of airplane from view origin */
var AIRPLANE_OFFSET_FRONT = 0.0008;
/** Vertical offset of airplane tip (used for collision detection) from view
 *    origin
 */
var AIRPLANE_TIP_UP = -0.0004;
/** Frontal offset of airplane tip from view origin */
var AIRPLANE_TIP_FRONT = 0.001;

/** No obstacles, static obstacles, or moving obstacles. (0,1,2, respectively)
 */
var obstacleLevel = 0;
/** Array of obstacles' origin */
var obstacleOrigin = [];
/** Array of obstacles' angle (ccw rotation from +y direction) */
var obstacleAngle = [];
/** Array of obstacles' rotation quaternion {quat} */
var obstacleRotation = [];
/** Array of obstacles' velocity vectors {vec3} */
var obstacleVelocity = [];
/** Array of obstacles' model-to-world matrices {mat4} */
var obstacleModelMatrix = [];

/** Number of obstacles */
var OBSTACLE_COUNT = 75;
/** Model-to-World scale of obstacles */
var OBSTACLE_SCALE = vec3.fromValues(0.1,0.1,0.1);

/** Initialization of airplane.js */
function airplaneInit(){

  /** Register shaders, draw calls, animate calls. */
  var prefix = "airplane";
  shaderPrefix.push(prefix);
  shaderInit[prefix] = airplaneShaderInit;
  bufferInit[prefix] = airplaneBufferInit;
  drawFunctions[prefix] = airplaneDraw;
  animateFunctions[prefix] = airplaneAnimate;

  /** Initialize airplane and obstacles. */
  airplaneGenerateShape();
  airplaneInitObstacles();
}

/** Initialize airplane's shader programs and variable locations. */
function airplaneShaderInit(){
  airplaneShaderProgram = shaderPrograms[AIRPLANE_PREFIX];

  /** Attributes */
  airplaneLocations["aVertexPosition"] = gl.getAttribLocation(airplaneShaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(airplaneLocations["aVertexPosition"]);

  airplaneLocations["aVertexColor"] = gl.getAttribLocation(airplaneShaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(airplaneLocations["aVertexColor"]);

  airplaneLocations["aVertexNormal"] = gl.getAttribLocation(airplaneShaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(airplaneLocations["aVertexNormal"]);

  /** Uniforms */
  airplaneLocations["uPMatrix"] = gl.getUniformLocation(airplaneShaderProgram, "uPMatrix");
  airplaneLocations["uMVMatrix"] = gl.getUniformLocation(airplaneShaderProgram, "uMVMatrix");
  airplaneLocations["uModelMatrix"] = gl.getUniformLocation(airplaneShaderProgram, "uModelMatrix");

  airplaneLocations["uViewOrigin"] = gl.getUniformLocation(airplaneShaderProgram, "uViewOrigin");
  airplaneLocations["uLightDirection"] = gl.getUniformLocation(airplaneShaderProgram, "uLightDirection");
  airplaneLocations["uAmbientLight"] = gl.getUniformLocation(airplaneShaderProgram, "uAmbientLight");
  airplaneLocations["uDiffuseLight"] = gl.getUniformLocation(airplaneShaderProgram, "uDiffuseLight");
  airplaneLocations["uSpecularLight"] = gl.getUniformLocation(airplaneShaderProgram, "uSpecularLight");
}

/** Initialize airplane's buffer. */
function airplaneBufferInit(){

  /** Create buffers. */
  airplanePositionBuffer = gl.createBuffer();
  airplaneIndexBuffer = gl.createBuffer();
  airplaneColorBuffer = gl.createBuffer();
  airplaneNormalBuffer = gl.createBuffer();

  /** Bind buffers. */
  airplanePositionBuffer.itemSize = 3;
  airplanePositionBuffer.numOfItems = airplanePositionArray.length / airplanePositionBuffer.itemSize;
  gl.bindBuffer(gl.ARRAY_BUFFER, airplanePositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(airplanePositionArray), gl.STATIC_DRAW);
  
  airplaneIndexBuffer.itemSize = 1;
  airplaneIndexBuffer.numOfItems = airplaneIndexArray.length / airplaneIndexBuffer.itemSize;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, airplaneIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(airplaneIndexArray), gl.STATIC_DRAW);

  airplaneColorBuffer.itemSize = 3;
  airplaneColorBuffer.numOfItems = airplaneColorArray.length / airplaneColorBuffer.itemSize;
  gl.bindBuffer(gl.ARRAY_BUFFER, airplaneColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(airplaneColorArray), gl.STATIC_DRAW);

  airplaneNormalBuffer.itemSize = 3;
  airplaneNormalBuffer.numOfItems = airplaneNormalArray.length / airplaneNormalBuffer.itemSize;
  gl.bindBuffer(gl.ARRAY_BUFFER, airplaneNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(airplaneNormalArray), gl.STATIC_DRAW);
  
}

/** Airplane draw call */
function airplaneDraw(){

  /** Update matrices. */
  airplanePrepareMatrix();
  obstaclePrepareMatrix();

  /** Setup variables. */
  gl.useProgram(airplaneShaderProgram);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, airplanePositionBuffer);
  gl.vertexAttribPointer(airplaneLocations["aVertexPosition"], airplanePositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, airplaneIndexBuffer);
 
  gl.bindBuffer(gl.ARRAY_BUFFER, airplaneColorBuffer);
  gl.vertexAttribPointer(airplaneLocations["aVertexColor"], airplaneColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, airplaneNormalBuffer);
  gl.vertexAttribPointer(airplaneLocations["aVertexNormal"], airplaneNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(airplaneLocations["uPMatrix"], false, pMatrix);
  gl.uniformMatrix4fv(airplaneLocations["uMVMatrix"], false, mvMatrix);
  gl.uniform3fv(airplaneLocations["uViewOrigin"], viewOrigin);

  gl.uniform3fv(airplaneLocations["uLightDirection"], LIGHT_DIRECTION);
  gl.uniform3fv(airplaneLocations["uAmbientLight"], AMBIENT_LIGHT);
  gl.uniform3fv(airplaneLocations["uDiffuseLight"], DIFFUSE_LIGHT);
  gl.uniform3fv(airplaneLocations["uSpecularLight"], SPECULAR_LIGHT);

  /** Draw! */
  airplaneDrawObstacle();
  airplaneDrawAirplane();
  
}

/** Draw airplane. */
function airplaneDrawAirplane(){
  gl.uniformMatrix4fv(airplaneLocations["uModelMatrix"], false, airplaneModelMatrix);
  gl.drawElements(gl.TRIANGLES, airplaneIndexBuffer.numOfItems, gl.UNSIGNED_INT, 0);
}

/** Draw obstacles. */
function airplaneDrawObstacle(){
  if(obstacleLevel !== 0){
    for(var i = 0; i < OBSTACLE_COUNT; i++){
      gl.uniformMatrix4fv(airplaneLocations["uModelMatrix"], false, obstacleModelMatrix[i]);
      gl.drawElements(gl.TRIANGLES, airplaneIndexBuffer.numOfItems, gl.UNSIGNED_INT, 0);
    }
  }
}

/** Update airplane's model-to-world matrix. */
function airplanePrepareMatrix(){

  /** Prepare required quats and vecs. */
  var rotation = mat4.create();
    mat4.fromQuat(rotation, viewQuat);
  
  var offsetFront = vec3.create();
    vec3.scale(offsetFront, viewLookAt, AIRPLANE_OFFSET_FRONT);
  
  var offsetUp = vec3.create();
    vec3.scale(offsetUp, viewUp, AIRPLANE_OFFSET_UP);

  /** Generate matrix. */
  var m = mat4.create();

  mat4.translate(m, m, offsetFront);
  mat4.translate(m, m, offsetUp);
  mat4.translate(m, m, viewOrigin);
  mat4.multiply(m, m, rotation);
  mat4.rotateZ(m, m, degToRad(180));
  mat4.scale(m, m, AIRPLANE_SCALE);

  airplaneModelMatrix = m;
}

/** Update obstacles' model-to-world matrices. */
function obstaclePrepareMatrix(){
  for(var i = 0; i < OBSTACLE_COUNT; i++){
    mat4.fromRotationTranslationScale(obstacleModelMatrix[i], obstacleRotation[i], obstacleOrigin[i], OBSTACLE_SCALE);
  }
}

/**
 * Airplane animate call
 *
 * @param {float} lapse timelapse since last frame in sec
 */
function airplaneAnimate(lapse){

  /** Move the obstacles only when necessary. */
  if(obstacleLevel === 2){
    for(var i = 0; i < OBSTACLE_COUNT; i++){

      /** Update obstacles' locations. */
      vec3.scaleAndAdd(obstacleOrigin[i], obstacleOrigin[i], obstacleVelocity[i], lapse);

      /** Check boundary. */
      if(obstacleOrigin[i][0] < -1.2){
        obstacleOrigin[i][0] += 2.4;
      }else if(obstacleOrigin[i][0] > 1.2){
        obstacleOrigin[i][0] -= 2.4;
      }

      if(obstacleOrigin[i][1] < -1.2){
        obstacleOrigin[i][1] += 2.4;
      }else if(obstacleOrigin[i][1] > 1.2){
        obstacleOrigin[i][1] -= 2.4;
      }
    }
  }
}

/** Generate airplane model. 
 *
 *  The default model is an airplane centered at origin, with its front facing
 *    +y direction, and its wings expand along x axis.
 */
function airplaneGenerateShape(){

  /** Generate body part */

  /** Number of layers along y axis */
  var depth_total = 2;
  /** Y coordinates of each layer */
  var depth_coords = [-1.0,1.0];
  /** Number of points at each layer (radial resolution) */
  var angle_total = 36;
  /** Helper function to get index with depth and angle
   *  @param {int} d depth index
   *  @param {int} a angle index
   *  @return {int} index of specified point
   */
  var body_index = function(d,a){
    /** Smart modulo operation to handle negative "a" */
    return d*angle_total+((a % angle_total) + angle_total) % angle_total;
  };

  /** Fill array. */
  for(var depth = 0; depth < depth_total; depth++){
    for(var angle = 0; angle < angle_total; angle++){
      /** Push vertex positions, normals, and colors. */
      airplanePositionArray.push(0.2*Math.sin(degToRad(360.0/angle_total*angle)));
      airplanePositionArray.push(depth_coords[depth]);
      airplanePositionArray.push(0.2*Math.cos(degToRad(360.0/angle_total*angle)));
      airplaneNormalArray.push(Math.sin(degToRad(360.0/angle_total*angle)));
      airplaneNormalArray.push(0.0);
      airplaneNormalArray.push(Math.cos(degToRad(360.0/angle_total*angle)));
      airplanePushColor();
    }

    /** Push indices to index array. */
    if(depth !== 0){
      for(var angle = 0; angle < angle_total; angle++){
        airplaneIndexArray.push(body_index(depth,angle));
        airplaneIndexArray.push(body_index(depth-1,angle));
        airplaneIndexArray.push(body_index(depth-1,angle+1));
        airplaneIndexArray.push(body_index(depth,angle+1));
        airplaneIndexArray.push(body_index(depth,angle));
        airplaneIndexArray.push(body_index(depth-1,angle+1));
      }
    }
  }

  /** Keep track of how many vertices already in array. */
  var positionOffset = depth_total * angle_total;

  /** Generate tail. */
  airplanePositionArray.push(0);
  airplanePositionArray.push(-1.15);
  airplanePositionArray.push(0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(-1.0);
  airplaneNormalArray.push(0.0);
  airplanePushColor();
  for(var angle = 0; angle < angle_total; angle++){
    airplaneIndexArray.push(positionOffset);
    airplaneIndexArray.push(body_index(0,angle+1));
    airplaneIndexArray.push(body_index(0,angle));
  }

  positionOffset += 1;

  /** Generate head. */
  airplanePositionArray.push(0);
  airplanePositionArray.push(1.2);
  airplanePositionArray.push(0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplanePushColor();
  for(var angle = 0; angle < angle_total; angle++){
    airplaneIndexArray.push(positionOffset);
    airplaneIndexArray.push(body_index(depth_total-1,angle));
    airplaneIndexArray.push(body_index(depth_total-1,angle+1));
  }

  positionOffset += 1;

  /** Generate left wing. */
  airplanePositionArray.push(-0.2);
  airplanePositionArray.push(-0.2);
  airplanePositionArray.push(0);
  airplanePositionArray.push(-0.2);
  airplanePositionArray.push(0.5);
  airplanePositionArray.push(0.0);
  airplanePositionArray.push(-1.6);
  airplanePositionArray.push(-0.5);
  airplanePositionArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplanePushColor();
  airplanePushColor();
  airplanePushColor();
  airplaneIndexArray.push(positionOffset+0);
  airplaneIndexArray.push(positionOffset+1);
  airplaneIndexArray.push(positionOffset+2);

  positionOffset += 3;

  /** Generate left tail wing. */
  airplanePositionArray.push(-0.2);
  airplanePositionArray.push(-1.0);
  airplanePositionArray.push(0.0);
  airplanePositionArray.push(-0.2);
  airplanePositionArray.push(-0.8);
  airplanePositionArray.push(0.0);
  airplanePositionArray.push(-0.6);
  airplanePositionArray.push(-1.0);
  airplanePositionArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplanePushColor();
  airplanePushColor();
  airplanePushColor();
  airplaneIndexArray.push(positionOffset+0);
  airplaneIndexArray.push(positionOffset+1);
  airplaneIndexArray.push(positionOffset+2);

  positionOffset += 3;

  /** Generate right wing. */
  airplanePositionArray.push(0.2);
  airplanePositionArray.push(-0.2);
  airplanePositionArray.push(0);
  airplanePositionArray.push(0.2);
  airplanePositionArray.push(0.5);
  airplanePositionArray.push(0.0);
  airplanePositionArray.push(1.6);
  airplanePositionArray.push(-0.5);
  airplanePositionArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplanePushColor();
  airplanePushColor();
  airplanePushColor();
  airplaneIndexArray.push(positionOffset+0);
  airplaneIndexArray.push(positionOffset+1);
  airplaneIndexArray.push(positionOffset+2);

  positionOffset += 3;

  /** Generate right tail wing. */
  airplanePositionArray.push(0.2);
  airplanePositionArray.push(-1.0);
  airplanePositionArray.push(0.0);
  airplanePositionArray.push(0.2);
  airplanePositionArray.push(-0.8);
  airplanePositionArray.push(0.0);
  airplanePositionArray.push(0.6);
  airplanePositionArray.push(-1.0);
  airplanePositionArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplanePushColor();
  airplanePushColor();
  airplanePushColor();
  airplaneIndexArray.push(positionOffset+0);
  airplaneIndexArray.push(positionOffset+1);
  airplaneIndexArray.push(positionOffset+2);

  positionOffset += 3;

  /** Generate center tail wing. */
  airplanePositionArray.push(0.0);
  airplanePositionArray.push(-1.0);
  airplanePositionArray.push(0.2);
  airplanePositionArray.push(0.0);
  airplanePositionArray.push(-0.8);
  airplanePositionArray.push(0.2);
  airplanePositionArray.push(0.0);
  airplanePositionArray.push(-1.0);
  airplanePositionArray.push(0.6);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(1.0);
  airplaneNormalArray.push(0.0);
  airplaneNormalArray.push(0.0);
  airplanePushColor();
  airplanePushColor();
  airplanePushColor();
  airplaneIndexArray.push(positionOffset+0);
  airplaneIndexArray.push(positionOffset+1);
  airplaneIndexArray.push(positionOffset+2);

  positionOffset += 3;

}

/** Helper function to push a color of a vertex */
function airplanePushColor(){
  airplaneColorArray.push(AIRPLANE_BODY_COLOR[0]);
  airplaneColorArray.push(AIRPLANE_BODY_COLOR[1]);
  airplaneColorArray.push(AIRPLANE_BODY_COLOR[2]);  
}

/** Initialize obstacles. */
function airplaneInitObstacles(){
  for(var i = 0; i < OBSTACLE_COUNT; i++){

    /** Generate random positions. */
    obstacleOrigin[i] = vec3.fromValues(airplaneRandomGenerator(-1.0,1.0), 
                                        airplaneRandomGenerator(-1.0,1.0), 
                                        airplaneRandomGenerator(0.4,1.0));
    
    /** Generate random velocity and direction. */
    var angle = airplaneRandomGenerator(-Math.PI, Math.PI);
    var velocity = airplaneRandomGenerator(0.005, 0.1);

    obstacleAngle[i] = angle;

    obstacleRotation[i] = quat.create();
    quat.setAxisAngle(obstacleRotation[i], Z_AXIS, angle);

    obstacleVelocity[i] = vec3.fromValues(-velocity * Math.sin(angle), velocity * Math.cos(angle), 0.0);

    /** Initialize model-to-world matrix. */
    obstacleModelMatrix[i] = mat4.create();
  }
}

/** Helper function to generate random values within a range
 *  @param {float} min
 *  @param {float} max
 */
function airplaneRandomGenerator(min, max){
  return min + Math.random() * (max - min);
}

