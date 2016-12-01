/**
 * startup.js
 * 
 * @fileoverview Manages startup functions as well as restart and gameover. 
 *   Part of this file is given as course materials for CS418 at University of 
 *   Illinois at Urbana-Champaign. (Course website: 
 *   https://courses.engr.illinois.edu/cs418/ ) 
 * @author Po-Han Huang <phuang17@illinois.edu>
 */

/** Main GL entity */
var gl;

/** Shader prefixes */
var shaderPrefix = [];
/** Shader programs */
var shaderPrograms = {};
/** Shader initialization functions */
var shaderInit = {};
/** Buffer initialization functions */
var bufferInit = {};
/** Draw functions */
var drawFunctions = {};
/** Animate functions */
var animateFunctions = {};

/** Timers */
var startTime;
var previousTime;

/** Enter point of the scripts for initialization of everything. */
function startup() {

  /** Get message borad and display message. */
  msgDOM = document.getElementById("msgDOM").firstChild;
  msg("Startup() called.");
  
  /** Create GL entity. */
  var canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  gl.clearColor(135/255, 206/255, 250/255, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.getExtension("OES_element_index_uint");
  
  /** Set timers. */
  startTime = previousTime = Date.now();
  
  /** Initialize all scripts, shaders, and buffers. */
  initAll();
  msg("Iitializing shaders...");
  setupShaders(); 
  msg("Iitializing buffers...");
  setupBuffers();

  /** Start drawing! */
  tick();
}

/** Render a frame. */
function tick() {
  requestAnimFrame(tick);

  /** Only draw and animate if game is still playing. */
  if(playing){
    draw();
    animate();
    interfaceUpdate();
  }

  /** Check if restart. */
  if(currentlyPressedKeys[82]){
    restart();
  }
}

/** Create GL context. 
 *  @param {canvasElement} canvas
 *  @return {glContext}
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    /** For debugging only */
    //  context = WebGLDebugUtils.makeDebugContext(canvas.getContext(names[i]));
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/** Setup all shaders. */
function setupShaders(){
  for(var i = 0; i < shaderPrefix.length; i++){
    setupOneShader(shaderPrefix[i]);
    shaderInit[shaderPrefix[i]]();
  }
}

/** Setup one shader with specified identification prefix.
 *  @param {string} prefix
 */
function setupOneShader(prefix){

  /** Create new program. */
  var oneShaderProgram = gl.createProgram();
  /** Get shader codes. */
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var vertexShaderSource = document.getElementById(prefix + "VertexShaderDOM").innerHTML;
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  var fragmentShaderSource = document.getElementById(prefix + "FragmentShaderDOM").innerHTML;
  
  /** Compile and link program. */
  gl.shaderSource(vertexShader,vertexShaderSource);
  gl.compileShader(vertexShader);
  gl.attachShader(oneShaderProgram, vertexShader);
  gl.shaderSource(fragmentShader,fragmentShaderSource);
  gl.compileShader(fragmentShader);
  gl.attachShader(oneShaderProgram, fragmentShader);
  gl.linkProgram(oneShaderProgram);

  if (!gl.getProgramParameter(oneShaderProgram, gl.LINK_STATUS)) {
    console.log("Failed to setup shader:" + prefix);
  }

  shaderPrograms[prefix] = oneShaderProgram;
}

/** Setup all buffers. */
function setupBuffers(){
  for(var i = 0; i < shaderPrefix.length; i++){
    bufferInit[shaderPrefix[i]]();
  }
}

/** Draw a frame by calling all draw functions. */
function draw(){
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
  for(var i = 0; i < shaderPrefix.length; i++){
    drawFunctions[shaderPrefix[i]]();
  }
}

/** Animate by calling all animate functions. */
function animate(){
  /** Get timelapse since last frame in sec. */
  var lapse = Date.now() - previousTime;
  previousTime = previousTime + lapse;
  lapse /= 1000.0;

  /** Update physics and views. */
  physicsUpdate(lapse);
  viewUpdateMatrix();

  /** Call animate functions. */
  for(var i = 0; i < shaderPrefix.length; i++){
    animateFunctions[shaderPrefix[i]](lapse);
  }
}

/** Convert degree to rad. 
 *  @param {float} d degree
 *  @return {float} r rad
 */
function degToRad(d){
  return d * Math.PI / 180 ;
}

/** Convert rad to degree. 
 *  @param {float} r rad
 *  @return {float} d degree
 */
function radToDeg(r){
  return r / Math.PI * 180 ;
}

/** Initialize all scripts. */
function initAll(){
  msg("Iitializing interface...");
  interfaceInit();
  msg("Iitializing view...");
  viewInit();
  msg("Iitializing physics...");
  physicsInit();
  msg("Iitializing airplane...");
  airplaneInit();
  msg("Iitializing misc...");
  miscInit();
  msg("Iitializing terrain...");
  terrainInit();
}

/** Restart the game. */
function restart(){

  playing = true;
  ground = true;
  reverse = false;

  startTime = previousTime = Date.now();

  viewQuat = quat.create();
  viewOrigin = vec3.fromValues(0.0,-0.9,AIRPLANE_HEIGHT);
  velocity = vec3.create();

  interfaces.thrust.set(0.0);

  msg("Initialization done! Start having fun!");

  document.getElementById("msgDOM").style.color = "black";
}

/** End the game and display text on message board. 
 *  @param {string} text
 */
function gameover(text){
  playing = false;
  msg(text);
  document.getElementById("msgDOM").style.color = "red";
}