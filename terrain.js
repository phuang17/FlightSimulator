/**
 * terrain.js
 * 
 * @fileoverview Manages buffers, arrays, and other data related to terrain.
 * @author Po-Han Huang <phuang17@illinois.edu>
 */

/** Identification prefix for terrain shader. */
var TERRAIN_PREFIX = "terrain";

/** GL buffers for terrain. */
var terrainPositionBuffer;
var terrainIndexBuffer;
var terrainColorBuffer;
var terrainNormalBuffer;

/** Data array for terrain. */
var terrainPositionArray;
var terrainIndexArray;
var terrainColorArray;
var terrainNormalArray;

/** Shader program for terrain. */
var terrainShaderProgram;
/** Variable locations in shader program. */
var terrainLocations = {};

/** Whether terrain is ready. (Terrain is generated asynchronously.) */
var terrainReady = false;

/** Detail level of terrain. */
var TERRAIN_DETAIL_LEVEL = 8;
/** Number of vertices on each side of terrain. */
var TERRAIN_SIZE = Math.pow(2, TERRAIN_DETAIL_LEVEL) + 1;

/** Random generator parameters. See terrainRandomFunction(). */
var TERRAIN_RANDOM_INITIAL = 0.75;
var TERRAIN_RANDOM_DECAY = 0.6;

/** Initialize terrain's shader programs and variable locations. */
function terrainShaderInit(){
  terrainShaderProgram = shaderPrograms[TERRAIN_PREFIX];

  /** Attributes */
  terrainLocations["aVertexPosition"] = gl.getAttribLocation(terrainShaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(terrainLocations["aVertexPosition"]);

  terrainLocations["aVertexColor"] = gl.getAttribLocation(terrainShaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(terrainLocations["aVertexColor"]);


  terrainLocations["aVertexNormal"] = gl.getAttribLocation(terrainShaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(terrainLocations["aVertexNormal"]);

  /** Uniforms */
  terrainLocations["uPMatrix"] = gl.getUniformLocation(terrainShaderProgram, "uPMatrix");
  terrainLocations["uMVMatrix"] = gl.getUniformLocation(terrainShaderProgram, "uMVMatrix");

  terrainLocations["uViewOrigin"] = gl.getUniformLocation(terrainShaderProgram, "uViewOrigin");
  terrainLocations["uLightDirection"] = gl.getUniformLocation(terrainShaderProgram, "uLightDirection");
  terrainLocations["uAmbientLight"] = gl.getUniformLocation(terrainShaderProgram, "uAmbientLight");
  terrainLocations["uDiffuseLight"] = gl.getUniformLocation(terrainShaderProgram, "uDiffuseLight");
  terrainLocations["uSpecularLight"] = gl.getUniformLocation(terrainShaderProgram, "uSpecularLight");
  
}

/** Initialize airplane's buffer. */
function terrainBufferInit(){

  terrainPositionBuffer = gl.createBuffer();
  terrainPositionBuffer.itemSize = 3;
  terrainPositionBuffer.numOfItems = TERRAIN_SIZE * TERRAIN_SIZE;
  
  terrainIndexBuffer = gl.createBuffer();
  terrainIndexBuffer.itemSize = 1;
  terrainIndexBuffer.numOfItems = 3 * 2 * (TERRAIN_SIZE - 1) * (TERRAIN_SIZE - 1);

  terrainColorBuffer = gl.createBuffer();
  terrainColorBuffer.itemSize = 3;
  terrainColorBuffer.numOfItems = TERRAIN_SIZE * TERRAIN_SIZE;

  terrainNormalBuffer = gl.createBuffer();
  terrainNormalBuffer.itemSize = 3;
  terrainNormalBuffer.numOfItems = TERRAIN_SIZE * TERRAIN_SIZE;
  
}

/** Terrain draw call */
function terrainDraw(){
  if(terrainReady){

    /** Setup variables. */
    gl.useProgram(terrainShaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainPositionBuffer);
    gl.vertexAttribPointer(terrainLocations["aVertexPosition"], terrainPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndexBuffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainColorBuffer);
    gl.vertexAttribPointer(terrainLocations["aVertexColor"], terrainColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainNormalBuffer);
    gl.vertexAttribPointer(terrainLocations["aVertexNormal"], terrainNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(terrainLocations["uPMatrix"], false, pMatrix);
    gl.uniformMatrix4fv(terrainLocations["uMVMatrix"], false, mvMatrix);

    gl.uniform3fv(terrainLocations["uViewOrigin"], viewOrigin);
    gl.uniform3fv(terrainLocations["uLightDirection"], LIGHT_DIRECTION);
    gl.uniform3fv(terrainLocations["uAmbientLight"], AMBIENT_LIGHT);
    gl.uniform3fv(terrainLocations["uDiffuseLight"], DIFFUSE_LIGHT);
    gl.uniform3fv(terrainLocations["uSpecularLight"], SPECULAR_LIGHT);

    /** Draw! */
    gl.drawElements(gl.TRIANGLES, terrainIndexBuffer.numOfItems, gl.UNSIGNED_INT, 0);
  }
}

/**
 * Terrain animate call
 *
 * @param {float} lapse timelapse since last frame in sec
 */
function terrainAnimate(lapse){

}

/** Initialization of terrain.js */
function terrainInit(){

  /** Register shaders, draw calls, animate calls. */
  var prefix = "terrain";
  shaderPrefix.push(prefix);
  shaderInit[prefix] = terrainShaderInit;
  bufferInit[prefix] = terrainBufferInit;
  drawFunctions[prefix] = terrainDraw;
  animateFunctions[prefix] = terrainAnimate;

  /** Initialize arrays. */
  terrainPositionArray = new Float32Array(3 * TERRAIN_SIZE * TERRAIN_SIZE);
  terrainIndexArray = new Int32Array(3 * 2 * (TERRAIN_SIZE - 1) * (TERRAIN_SIZE - 1));
  terrainColorArray = new Float32Array(3 * TERRAIN_SIZE * TERRAIN_SIZE);
  terrainNormalArray = new Float32Array(3 * TERRAIN_SIZE * TERRAIN_SIZE);

  /** Start asynchronous terrain generation.
   *  Terrain is generated asynchronously such that the user would not feel that
   *    the browser freezes. 
   *  The functions are called on after another in the following order: 
   *  <ul>
   *    <li>terrainGenerateTerrain()</li>
   *    <li>terrainGenerateTerrainInterator()</li>
   *    <li>terrainAddField()</li>
   *    <li>terrainGenerateIndex()</li>
   *    <li>terrainGenerateNormal()</li>
   *    <li>terrainGenerateColor()</li>
   *    <li>terrainBindBuffer()</li>      
   *  </ul>
   */
  terrainGenerateTerrain();
}

/** Prepare for terrain generation. */
function terrainGenerateTerrain(){

  /** Set X and Y coordinates. */
  for(var row = 0; row < TERRAIN_SIZE; row++){
    for(var col = 0; col < TERRAIN_SIZE; col++){
      terrainPositionArray[terrainIndex(row, col) + 0] = -1.0 + 2.0 / (TERRAIN_SIZE - 1) * col;
      terrainPositionArray[terrainIndex(row, col) + 1] = -1.0 + 2.0 / (TERRAIN_SIZE - 1) * row;
    }
  }

  /** Specify the first 9 heights. */
  terrainPositionArray[terrainIndex(0                     , 0                     ) + 2] = 0.1;
  terrainPositionArray[terrainIndex(0                     , (TERRAIN_SIZE - 1) / 2) + 2] = -0.3;
  terrainPositionArray[terrainIndex(0                     , (TERRAIN_SIZE - 1)    ) + 2] = 0.1;
  terrainPositionArray[terrainIndex((TERRAIN_SIZE - 1) / 2, 0                     ) + 2] = 0.6;
  terrainPositionArray[terrainIndex((TERRAIN_SIZE - 1) / 2, (TERRAIN_SIZE - 1) / 2) + 2] = 0.8;
  terrainPositionArray[terrainIndex((TERRAIN_SIZE - 1) / 2, (TERRAIN_SIZE - 1)    ) + 2] = 0.6;
  terrainPositionArray[terrainIndex((TERRAIN_SIZE - 1)    , 0                     ) + 2] = 0.1;
  terrainPositionArray[terrainIndex((TERRAIN_SIZE - 1)    , (TERRAIN_SIZE - 1) / 2) + 2] = -0.3;
  terrainPositionArray[terrainIndex((TERRAIN_SIZE - 1)    , (TERRAIN_SIZE - 1)    ) + 2] = 0.1;

  /** Asynchronously call the terrain generation iterator. */
  msg("Generating terrain vertices..... 0%", 
      function(){
        terrainGenerateTerrainInterator( TERRAIN_DETAIL_LEVEL, TERRAIN_DETAIL_LEVEL - 1, terrainRandomFunction)});

}

/**
 * An interation of diamond-square algorithm.
 *
 * This function automatically calls the next iteration.
 *
 * @param {int} toplevel
 * @param {int} currentLevel
 * @param {function} randFunction
 */
function terrainGenerateTerrainInterator(topLevel, currentLevel, randFunction){

  /** Check if the end of interation. */
  if(currentLevel > 0){

    /** Stride width at current level. */
    var stride = Math.pow(2,currentLevel);
    /** Number of strides at current level. */
    var times = Math.pow(2,topLevel - currentLevel);

    /** Diamond step */
    for(var strideRow = 0; strideRow < times; strideRow++){
      for(var strideCol = 0; strideCol < times; strideCol++){
        var row = strideRow * stride;
        var col = strideCol * stride;
        var corners = [ terrainPositionArray[terrainIndex(row         , col         ) + 2],
                        terrainPositionArray[terrainIndex(row         , col + stride) + 2],
                        terrainPositionArray[terrainIndex(row + stride, col + stride) + 2],
                        terrainPositionArray[terrainIndex(row + stride, col         ) + 2]];

        /** Assign value with average of four corners plus rand. */
        terrainPositionArray[terrainIndex(row + stride / 2, col + stride / 2) + 2] = 
          (corners[0] + corners[1] + corners[2] + corners[3]) / 4
          + terrainRandomFunction(topLevel, currentLevel);

      }
    }

    /** Square step */
    for(var strideRow = 0; strideRow < times; strideRow++){
      for(var strideCol = 0; strideCol < times; strideCol++){
        var row = strideRow * stride;
        var col = strideCol * stride;
        var corners;

        /** Assign height to bottom vertex. */
        if(strideRow == 0){
          corners = [ terrainPositionArray[terrainIndex(row             , col             ) + 2],
                      terrainPositionArray[terrainIndex(row + stride / 2, col + stride / 2) + 2],
                      terrainPositionArray[terrainIndex(row             , col + stride    ) + 2]];
          terrainPositionArray[terrainIndex(row, col + stride / 2) + 2] = 
            (corners[0] + corners[1] + corners[2]) / 3
            + terrainRandomFunction(topLevel, currentLevel);
        }

        /** Assign height to left vertex. */
        if(strideCol == 0){
          corners = [ terrainPositionArray[terrainIndex(row             , col             ) + 2],
                      terrainPositionArray[terrainIndex(row + stride / 2, col + stride / 2) + 2],
                      terrainPositionArray[terrainIndex(row + stride    , col             ) + 2]];
          terrainPositionArray[terrainIndex(row + stride / 2, col) + 2] = 
            (corners[0] + corners[1] + corners[2]) / 3
            + terrainRandomFunction(topLevel, currentLevel);
        }

        /** Assign height to top vertex. */
        if(strideRow == times - 1){
          corners = [ terrainPositionArray[terrainIndex(row + stride    , col             ) + 2],
                      terrainPositionArray[terrainIndex(row + stride / 2, col + stride / 2) + 2],
                      terrainPositionArray[terrainIndex(row + stride    , col + stride    ) + 2]];
          terrainPositionArray[terrainIndex(row + stride, col + stride / 2) + 2] = 
            (corners[0] + corners[1] + corners[2]) / 3
            + terrainRandomFunction(topLevel, currentLevel);
        }else{
          corners = [ terrainPositionArray[terrainIndex(row + stride    , col             ) + 2],
                      terrainPositionArray[terrainIndex(row + stride / 2, col + stride / 2) + 2],
                      terrainPositionArray[terrainIndex(row + stride    , col + stride    ) + 2],
                      terrainPositionArray[terrainIndex(row + stride/2*3, col + stride / 2) + 2]];
          terrainPositionArray[terrainIndex(row + stride, col + stride / 2) + 2] = 
            (corners[0] + corners[1] + corners[2] + corners[3]) / 4
            + terrainRandomFunction(topLevel, currentLevel);
        }

        /** Assign height to right vertex. */
        if(strideCol == times - 1){
          corners = [ terrainPositionArray[terrainIndex(row             , col + stride    ) + 2],
                      terrainPositionArray[terrainIndex(row + stride / 2, col + stride / 2) + 2],
                      terrainPositionArray[terrainIndex(row + stride    , col + stride    ) + 2]];
          terrainPositionArray[terrainIndex(row + stride / 2, col + stride) + 2] = 
            (corners[0] + corners[1] + corners[2]) / 3
            + terrainRandomFunction(topLevel, currentLevel);
        }else{
          corners = [ terrainPositionArray[terrainIndex(row             , col + stride    ) + 2],
                      terrainPositionArray[terrainIndex(row + stride / 2, col + stride / 2) + 2],
                      terrainPositionArray[terrainIndex(row + stride    , col + stride    ) + 2],
                      terrainPositionArray[terrainIndex(row + stride / 2, col + stride/2*3) + 2]];
          terrainPositionArray[terrainIndex(row + stride / 2, col + stride) + 2] = 
            (corners[0] + corners[1] + corners[2] + corners[3]) / 4
            + terrainRandomFunction(topLevel, currentLevel);
        }
      }
    }

    /** Asynchronously call next iteration. */
    msg("Generating terrain vertices..... " + ((topLevel - currentLevel) / topLevel * 100).toFixed(0) + "%", 
      function(){
        terrainGenerateTerrainInterator(topLevel, currentLevel - 1, randFunction)});
  }else{

    /** Asynchronously call terrainAddField(). */
    msg("Generating terrain fields..... 100%", 
      function(){
        terrainAddField();});
  }
}

/** Random number generator with decay along levels.
 *  @param {int} topLevel
 *  @param {int} currentLevel
 */
function terrainRandomFunction(topLevel, currentLevel){
  /** rand is uniform distibution within 
   *  +- 0.5 * TERRAIN_RANDOM_INITIAL * (TERRAIN_RANDOM_DECAY)^(topLevel - currentLevel)
   */
  return (Math.random() - 0.5) * TERRAIN_RANDOM_INITIAL * Math.pow(TERRAIN_RANDOM_DECAY, topLevel - currentLevel);
}

/** Generate flat regions. */
function terrainAddField(){

  for(var row = 0; row < TERRAIN_SIZE; row++){
    for(var col = 0; col < TERRAIN_SIZE; col++){

      var x = terrainPositionArray[terrainIndex(row,col) + 0];
      var y = terrainPositionArray[terrainIndex(row,col) + 1];
      var z = terrainPositionArray[terrainIndex(row,col) + 2];

      if(z < 0.0){
        /** If original height is negative. */
        terrainPositionArray[terrainIndex(row,col) + 2] = 0.0;
      }else if(x <= 0.004 && x >= -0.004 && ((y >= -1.0 && y <= -0.9)||(y >= 0.9 && y <= 1.0))){
        /** If location is in runways. */
        terrainPositionArray[terrainIndex(row,col) + 2] = 0.0;
      }else if(row === 0 || col === 0 || row === TERRAIN_SIZE-1 || col === TERRAIN_SIZE-1){
        /** Generate cliffs for the outer vertices. */
        terrainPositionArray[terrainIndex(row,col) + 2] = 0.0;
      }
    }
  }

  /** Asynchronously call terrainGenerateIndex(). */
  msg("Generating terrain indices..... 100%", 
      function(){
        terrainGenerateIndex();});
}

/** Generate indices. */
function terrainGenerateIndex(){
  
  var idx = 0;
  for(var row = 0; row < TERRAIN_SIZE - 1; row++){
    for(var col = 0; col < TERRAIN_SIZE - 1; col++){
      /** Lower triangle */
      terrainIndexArray[idx + 0] = row * TERRAIN_SIZE + col;
      terrainIndexArray[idx + 1] = row * TERRAIN_SIZE + col + 1;
      terrainIndexArray[idx + 2] = (row + 1) * TERRAIN_SIZE + col;
      /** Upper triangle */
      terrainIndexArray[idx + 3] = row * TERRAIN_SIZE + col + 1;
      terrainIndexArray[idx + 4] = (row + 1) * TERRAIN_SIZE + col + 1;
      terrainIndexArray[idx + 5] = (row + 1) * TERRAIN_SIZE + col;
      idx = idx + 6;
    }
  }

  /** Asynchronously call terrainGenerateNormal(). */
  msg("Generating terrain indices.....", 
      function(){
        terrainGenerateNormal();});
}

/** Generate normals. */
function terrainGenerateNormal(){

  for(var row = 0; row < TERRAIN_SIZE; row++){
    for(var col = 0; col < TERRAIN_SIZE; col++){

      /** Normal of a vertex is calculated by averaging the normals of the six
       *    triangles connected to the vertex.
       */

      var count = 0;
      var sum = vec3.create();
      var self = vec3.fromValues( terrainPositionArray[terrainIndex(row, col) + 0],
                                  terrainPositionArray[terrainIndex(row, col) + 1],
                                  terrainPositionArray[terrainIndex(row, col) + 2]);

      /** Add normal of bottom left triangle. */
      if(row > 0 && col > 0){
        var first  = vec3.fromValues(terrainPositionArray[terrainIndex(row + 0, col - 1) + 0],
                                     terrainPositionArray[terrainIndex(row + 0, col - 1) + 1],
                                     terrainPositionArray[terrainIndex(row + 0, col - 1) + 2]);
        var second = vec3.fromValues(terrainPositionArray[terrainIndex(row - 1, col + 0) + 0],
                                     terrainPositionArray[terrainIndex(row - 1, col + 0) + 1],
                                     terrainPositionArray[terrainIndex(row - 1, col + 0) + 2]);
        var normal = vec3.create();
        vec3.subtract(first, self, first);
        vec3.subtract(second, self, second);
        vec3.cross(normal, first, second);
        vec3.normalize(normal, normal);
        vec3.add(sum, sum, normal);
        count++;
      }

      /** Add normals of the two bottom right triangles. */
      if(row > 0 && col < TERRAIN_SIZE - 1){
        var first  = vec3.fromValues(terrainPositionArray[terrainIndex(row - 1, col + 0) + 0],
                                     terrainPositionArray[terrainIndex(row - 1, col + 0) + 1],
                                     terrainPositionArray[terrainIndex(row - 1, col + 0) + 2]);
        var second = vec3.fromValues(terrainPositionArray[terrainIndex(row - 1, col + 1) + 0],
                                     terrainPositionArray[terrainIndex(row - 1, col + 1) + 1],
                                     terrainPositionArray[terrainIndex(row - 1, col + 1) + 2]);
        var normal = vec3.create();
        vec3.subtract(first, self, first);
        vec3.subtract(second, self, second);
        vec3.cross(normal, first, second);
        vec3.normalize(normal, normal);
        vec3.add(sum, sum, normal);
        count++;
      }

      if(row > 0 && col < TERRAIN_SIZE - 1){
        var first  = vec3.fromValues(terrainPositionArray[terrainIndex(row - 1, col + 1) + 0],
                                     terrainPositionArray[terrainIndex(row - 1, col + 1) + 1],
                                     terrainPositionArray[terrainIndex(row - 1, col + 1) + 2]);
        var second = vec3.fromValues(terrainPositionArray[terrainIndex(row + 0, col + 1)+ 0],
                                     terrainPositionArray[terrainIndex(row + 0, col + 1)+ 1],
                                     terrainPositionArray[terrainIndex(row + 0, col + 1)+ 2]);
        var normal = vec3.create();
        vec3.subtract(first, self, first);
        vec3.subtract(second, self, second);
        vec3.cross(normal, first, second);
        vec3.normalize(normal, normal);
        vec3.add(sum, sum, normal);
        count++;
      }

      /** Add normal of top left triangle. */
      if(row < TERRAIN_SIZE - 1 && col < TERRAIN_SIZE - 1){
        var first  = vec3.fromValues(terrainPositionArray[terrainIndex(row + 0, col + 1)+ 0],
                                     terrainPositionArray[terrainIndex(row + 0, col + 1)+ 1],
                                     terrainPositionArray[terrainIndex(row + 0, col + 1)+ 2]);
        var second = vec3.fromValues(terrainPositionArray[terrainIndex(row + 1, col + 0)+ 0],
                                     terrainPositionArray[terrainIndex(row + 1, col + 0)+ 1],
                                     terrainPositionArray[terrainIndex(row + 1, col + 0)+ 2]);
        var normal = vec3.create();
        vec3.subtract(first, self, first);
        vec3.subtract(second, self, second);
        vec3.cross(normal, first, second);
        vec3.normalize(normal, normal);
        vec3.add(sum, sum, normal);
        count++;
      }

      /** Add normals of the two top left triangles. */
      if(row < TERRAIN_SIZE - 1 && col > 0){
        var first  = vec3.fromValues(terrainPositionArray[terrainIndex(row + 1, col + 0)+ 0],
                                     terrainPositionArray[terrainIndex(row + 1, col + 0)+ 1],
                                     terrainPositionArray[terrainIndex(row + 1, col + 0)+ 2]);
        var second = vec3.fromValues(terrainPositionArray[terrainIndex(row + 1, col - 1) + 0],
                                     terrainPositionArray[terrainIndex(row + 1, col - 1) + 1],
                                     terrainPositionArray[terrainIndex(row + 1, col - 1) + 2]);
        var normal = vec3.create();
        vec3.subtract(first, self, first);
        vec3.subtract(second, self, second);
        vec3.cross(normal, first, second);
        vec3.normalize(normal, normal);
        vec3.add(sum, sum, normal);
        count++;
      }

      if(row < TERRAIN_SIZE - 1 && col > 0){
        var first  = vec3.fromValues(terrainPositionArray[terrainIndex(row + 1, col - 1) + 0],
                                     terrainPositionArray[terrainIndex(row + 1, col - 1) + 1],
                                     terrainPositionArray[terrainIndex(row + 1, col - 1) + 2]);
        var second = vec3.fromValues(terrainPositionArray[terrainIndex(row + 0, col - 1) + 0],
                                     terrainPositionArray[terrainIndex(row + 0, col - 1) + 1],
                                     terrainPositionArray[terrainIndex(row + 0, col - 1) + 2]);
        var normal = vec3.create();
        vec3.subtract(first, self, first);
        vec3.subtract(second, self, second);
        vec3.cross(normal, first, second);
        vec3.normalize(normal, normal);
        vec3.add(sum, sum, normal);
        count++;
      }

      /** Take average. */
      vec3.scale(sum, sum, 1 / count);

      terrainNormalArray[terrainIndex(row, col) + 0] = sum[0];
      terrainNormalArray[terrainIndex(row, col) + 1] = sum[1];
      terrainNormalArray[terrainIndex(row, col) + 2] = sum[2];

    }
  }

  /** Asynchronously call terrainGenerateColor(). */
  msg("Generating terrain colors.....", 
      function(){
        terrainGenerateColor();});
}

/** Generate colors. */
function terrainGenerateColor(){

  for(var row = 0; row < TERRAIN_SIZE; row++){
    for(var col = 0; col < TERRAIN_SIZE; col++){

      /** Get height of the vertex. */
      var height = terrainPositionArray[terrainIndex(row, col) + 2];

      /** Colors from high to low: White -> Dark green -> Bright green */
      if(height > 0.6){
        terrainColorArray[terrainIndex(row, col) + 0] = 1.4;
        terrainColorArray[terrainIndex(row, col) + 1] = 1.4;
        terrainColorArray[terrainIndex(row, col) + 2] = 1.4;
      }else{
        terrainColorArray[terrainIndex(row, col) + 0] = 0.0;
        terrainColorArray[terrainIndex(row, col) + 1] = 1.2-height/0.6*0.9;
        terrainColorArray[terrainIndex(row, col) + 2] = 0.0;
      }
      
    }
  }

  /** Asynchronously call terrainBindBuffer(). */
  msg("Binding terrain buffers.....", 
      function(){
        terrainBindBuffer();});
}

/** Bind terrain buffers. */
function terrainBindBuffer(){

  gl.bindBuffer(gl.ARRAY_BUFFER, terrainPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, terrainPositionArray, gl.STATIC_DRAW);
  gl.vertexAttribPointer(terrainLocations["aVertexPosition"], terrainPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, terrainIndexArray, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, terrainColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, terrainColorArray, gl.STATIC_DRAW);
  gl.vertexAttribPointer(terrainLocations["aVertexColor"], terrainColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, terrainNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, terrainNormalArray, gl.STATIC_DRAW);
  gl.vertexAttribPointer(terrainLocations["aVertexNormal"], terrainNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  /** Finally, the terrain is ready! */
  terrainReady = true;
  msg("Initialization done! Start having fun!");
}

/** Helper function to get index of a vertex. 
 *  @param {int} row
 *  @param {int} col
 */
function terrainIndex(row, col){
  return (row * TERRAIN_SIZE + col) * 3;
}

