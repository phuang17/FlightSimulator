/**
 * misc.js
 * 
 * @fileoverview Manages miscellaneous objects, including runways, oceans, and
 *   the walls.
 * @author Po-Han Huang <phuang17@illinois.edu>
 */

/** Identification prefix for misc shader. */
var MISC_PREFIX = "misc";

/** GL buffers for misc. */
var miscPositionBuffer;
var miscColorBuffer;
var miscNormalBuffer;

/** Data array for misc objects. */
var miscPositionArray;
var miscColorArray;
var miscNormalArray;

/** Shader program for misc. */
var miscShaderProgram;
/** Variable locations in shader program. */
var miscLocations = {};

/** Runway colors */
var MISC_RUNWAY_BLACK = vec3.fromValues(0.2,0.2,0.2);
var MISC_RUNWAY_YELLOW = vec3.fromValues(1.0,0.9,0.3);
var MISC_RUNWAY_WHITE = vec3.fromValues(1.0,1.0,1.0);
/** Runway height to avoid z-fighting */
var MISC_RUNWAY_Z = 0.00001;

/** Ocean and wall colors */
var MISC_OCEAN_BLUE = vec3.fromValues(0.0,0.1,0.4);
var MISC_WALL_COLOR = vec3.fromValues(0.0,0.3,0.0);

/** Initialization of misc.js */
function miscInit(){

  /** Register shaders, draw calls, animate calls. */
  var prefix = "misc";
  shaderPrefix.push(prefix);
  shaderInit[prefix] = miscShaderInit;
  bufferInit[prefix] = miscBufferInit;
  drawFunctions[prefix] = miscDraw;
  animateFunctions[prefix] = miscAnimate;

  /** Initialize arrays. */
  miscPositionArray = [];
  miscColorArray = [];
  miscNormalArray = [];

  /** Initialize shapes. */
  miscGenerateShape();
}

/** Initialize misc's shader programs and variable locations. */
function miscShaderInit(){
  miscShaderProgram = shaderPrograms[MISC_PREFIX];

  /** Attributes */
  miscLocations["aVertexPosition"] = gl.getAttribLocation(miscShaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(miscLocations["aVertexPosition"]);

  miscLocations["aVertexColor"] = gl.getAttribLocation(miscShaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(miscLocations["aVertexColor"]);

  miscLocations["aVertexNormal"] = gl.getAttribLocation(miscShaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(miscLocations["aVertexNormal"]);

  /** Uniforms */
  miscLocations["uPMatrix"] = gl.getUniformLocation(miscShaderProgram, "uPMatrix");
  miscLocations["uMVMatrix"] = gl.getUniformLocation(miscShaderProgram, "uMVMatrix");

  miscLocations["uViewOrigin"] = gl.getUniformLocation(miscShaderProgram, "uViewOrigin");
  miscLocations["uLightDirection"] = gl.getUniformLocation(miscShaderProgram, "uLightDirection");
  miscLocations["uAmbientLight"] = gl.getUniformLocation(miscShaderProgram, "uAmbientLight");
  miscLocations["uDiffuseLight"] = gl.getUniformLocation(miscShaderProgram, "uDiffuseLight");
  miscLocations["uSpecularLight"] = gl.getUniformLocation(miscShaderProgram, "uSpecularLight");
}

/** Initialize misc's buffer. */
function miscBufferInit(){

  /** Create buffers. */
  miscPositionBuffer = gl.createBuffer();
  miscColorBuffer = gl.createBuffer();
  miscNormalBuffer = gl.createBuffer();

  /** Bind buffers. */
  miscPositionBuffer.itemSize = 3;
  miscPositionBuffer.numOfItems = miscPositionArray.length / miscPositionBuffer.itemSize;
  gl.bindBuffer(gl.ARRAY_BUFFER, miscPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(miscPositionArray), gl.STATIC_DRAW);

  miscColorBuffer.itemSize = 3;
  miscColorBuffer.numOfItems = miscColorArray.length / miscColorBuffer.itemSize;
  gl.bindBuffer(gl.ARRAY_BUFFER, miscColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(miscColorArray), gl.STATIC_DRAW);

  miscNormalBuffer.itemSize = 3;
  miscNormalBuffer.numOfItems = miscNormalArray.length / miscNormalBuffer.itemSize;
  gl.bindBuffer(gl.ARRAY_BUFFER, miscNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(miscNormalArray), gl.STATIC_DRAW);
  
}

/** Misc draw call */
function miscDraw(){

  /** Setup variables. */
  gl.useProgram(miscShaderProgram);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, miscPositionBuffer);
  gl.vertexAttribPointer(miscLocations["aVertexPosition"], miscPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
 
  gl.bindBuffer(gl.ARRAY_BUFFER, miscColorBuffer);
  gl.vertexAttribPointer(miscLocations["aVertexColor"], miscColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, miscNormalBuffer);
  gl.vertexAttribPointer(miscLocations["aVertexNormal"], miscNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(miscLocations["uPMatrix"], false, pMatrix);
  gl.uniformMatrix4fv(miscLocations["uMVMatrix"], false, mvMatrix);

  gl.uniform3fv(miscLocations["uViewOrigin"], viewOrigin);
  gl.uniform3fv(miscLocations["uLightDirection"], LIGHT_DIRECTION);
  gl.uniform3fv(miscLocations["uAmbientLight"], AMBIENT_LIGHT);
  gl.uniform3fv(miscLocations["uDiffuseLight"], DIFFUSE_LIGHT);
  gl.uniform3fv(miscLocations["uSpecularLight"], SPECULAR_LIGHT);

  /** Draw! */
  gl.drawArrays(gl.TRIANGLES, 0, miscPositionBuffer.numOfItems);
}

/** Misc animate call
 *
 * @param {float} lapse timelapse since last frame in sec
 */
function miscAnimate(lapse){
  
}

/** Generate misc shapes. */
function miscGenerateShape(){
  miscGenerateRunway();
  miscGenerateOcean();
  miscGenerateWall();
}

/** Generate runways. */
function miscGenerateRunway(){

  /** Runway at departure */

  /** Left black border */
  miscPushVertex(-0.0020, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0019, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0020, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0019, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0019, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0020, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

  /** Left white line */
  miscPushVertex(-0.0019, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0018, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0019, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0018, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0018, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0019, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);

  /** Left black main runway */
  miscPushVertex(-0.0018, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0001, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0018, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0001, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0001, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0018, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

  /** Right black main runway */
  miscPushVertex(0.0001, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0018, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0001, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0018, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0018, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0001, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

  /** Right white line */
  miscPushVertex(0.0018, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0019, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0018, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0019, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0019, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0018, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);

  /** Right black border */
  miscPushVertex(0.0019, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0020, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0019, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0020, -1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0020, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0019, -0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

  /** Generate center dashed line. */

  /** Number of yellow stripes */
  var yellow_total = 100;
  var stride = 0.1 / yellow_total;

  for(var i = 0; i < yellow_total; i++){
    var endpoints = [-1.0+i*stride,-1.0+i*stride+stride/2,-1.0+i*stride+stride];

    /** Black part */
    miscPushVertex(-0.0001, endpoints[0], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex( 0.0001, endpoints[0], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex(-0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex( 0.0001, endpoints[0], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex( 0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex(-0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

    /** Yellow part */
    miscPushVertex(-0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex( 0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex(-0.0001, endpoints[2], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex( 0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex( 0.0001, endpoints[2], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex(-0.0001, endpoints[2], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
  }

  /** Runway at destination */

  /** Left black border */
  miscPushVertex(-0.0020, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0019, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0020, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0019, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0019, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0020, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

  /** Left white line */
  miscPushVertex(-0.0019, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0018, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0019, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0018, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0018, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(-0.0019, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);

  /** Left black main runway */
  miscPushVertex(-0.0018, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0001, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0018, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0001, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0001, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(-0.0018, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

  /** Right black main runway */
  miscPushVertex(0.0001, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0018, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0001, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0018, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0018, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0001, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

  /** Right white line */
  miscPushVertex(0.0018, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0019, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0018, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0019, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0019, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);
  miscPushVertex(0.0018, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_WHITE);

  /** Right black border */
  miscPushVertex(0.0019, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0020, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0019, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0020, 0.9, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0020, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
  miscPushVertex(0.0019, 1.0, MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

  /** Generate center dashed line. */

  /** Number of yellow stripes */
  var yellow_total = 100;
  var stride = 0.1 / yellow_total;

  for(var i = 0; i < yellow_total; i++){
    var endpoints = [0.9+i*stride,0.9+i*stride+stride/2,0.9+i*stride+stride];

    /** Black part */
    miscPushVertex(-0.0001, endpoints[0], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex( 0.0001, endpoints[0], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex(-0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex( 0.0001, endpoints[0], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex( 0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);
    miscPushVertex(-0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_BLACK);

    /** Yellow part */
    miscPushVertex(-0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex( 0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex(-0.0001, endpoints[2], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex( 0.0001, endpoints[1], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex( 0.0001, endpoints[2], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
    miscPushVertex(-0.0001, endpoints[2], MISC_RUNWAY_Z, Z_AXIS, MISC_RUNWAY_YELLOW);
  }

}

/** Generate ocean. */
function miscGenerateOcean(){

  /** South */
  miscPushVertex(-1.0, -100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( 1.0, -100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex(-1.0,   -1.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( 1.0, -100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( 1.0,   -1.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex(-1.0,   -1.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);

  /** North */
  miscPushVertex(-1.0,   1.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( 1.0,   1.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex(-1.0, 100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( 1.0,   1.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( 1.0, 100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex(-1.0, 100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);

  /** West */
  miscPushVertex( -100.0, -100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex(   -1.0, -100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( -100.0,  100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex(   -1.0, -100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex(   -1.0,  100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( -100.0,  100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);

  /** East */
  miscPushVertex(   1.0, -100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( 100.0, -100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex(   1.0,  100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( 100.0, -100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex( 100.0,  100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
  miscPushVertex(   1.0,  100.0, 0.0, Z_AXIS, MISC_OCEAN_BLUE);
}

/** Generate wall. */
function miscGenerateWall(){

  /** West */
  miscPushVertex( -100.0, 0.0, 0.0, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex(   -1.0, 0.0, 0.0, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex( -100.0, 0.0, 0.6, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex(   -1.0, 0.0, 0.0, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex(   -1.0, 0.0, 0.6, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex( -100.0, 0.0, 0.6, Z_AXIS, MISC_WALL_COLOR);

  /** East */
  miscPushVertex(   1.0, 0.0, 0.0, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex( 100.0, 0.0, 0.0, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex(   1.0, 0.0, 0.6, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex( 100.0, 0.0, 0.0, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex( 100.0, 0.0, 0.6, Z_AXIS, MISC_WALL_COLOR);
  miscPushVertex(   1.0, 0.0, 0.6, Z_AXIS, MISC_WALL_COLOR);

}

/**
 * Helper function to push a vertex
 *
 * @param {float} x
 * @param {float} y
 * @param {float} z
 * @param {vec3|array} normal
 * @param {vec3|array} color
 */
function miscPushVertex(x,y,z,normal,color){
  miscPositionArray.push(x);
  miscPositionArray.push(y);
  miscPositionArray.push(z);
  miscNormalArray.push(normal[0]);
  miscNormalArray.push(normal[1]);
  miscNormalArray.push(normal[2]);
  miscColorArray.push(color[0]);
  miscColorArray.push(color[1]);
  miscColorArray.push(color[2]);
}

