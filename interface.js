/**
 * interface.js
 * 
 * @fileoverview Manages interfaces, including keyboard presses, sliders, 
 *   gauges, and location map.
 * @author Po-Han Huang <phuang17@illinois.edu>
 */

/** Currently pressed keys. True if pressed, otherwise not pressed. */
var currentlyPressedKeys = {};
/** Hold interface elements. */
var interfaces = {};
/** Hold text nodes of interface elements. */
var values = {};

/** Hold elements of airplane icons. */
var airplaneIcons = [];

/** Hold the text node of message board. */
var msgDOM;

/** Time limit of each game in ms. */
var TIMEOUT = 900 * 1000;

/** Initialize interfaces. */
function interfaceInit(){

  /** Attach key event listeners. */
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  /* Initialize gauges. */
  interfaces.velocity = new Gauge( document.getElementById("velocityGaugeCanvas") ).setOptions({ limitMax: 'true' });
  interfaces.velocity.maxValue = 0.04;
  interfaces.velocity.animationSpeed = 1;
  interfaces.velocity.set(0);
  values.velocity = document.getElementById("velocityGaugeValue").firstChild;

  interfaces.fuel = new Gauge( document.getElementById("fuelGaugeCanvas") ).setOptions({ limitMax: 'true' });
  interfaces.fuel.maxValue = 1;
  interfaces.fuel.animationSpeed = 1;
  interfaces.fuel.set(1);
  values.fuel = document.getElementById("fuelGaugeValue").firstChild;

  /** Initialize compass. */
  interfaces.orientation = document.getElementById("orientationCompass")

  /** Initialize sliders. */
  interfaces.roll = noUiSlider.create(document.getElementById("rollSlider"),
                    { start: [0], 
                      range: 
                      { 'min': [ -Math.PI / 2 ], 
                        'max': [ Math.PI / 2 ]
                      },
                      connect: [true, false],
                      animate: false
                    });
  values.roll = document.getElementById("rollSliderValue").firstChild;

  interfaces.pitch = noUiSlider.create(document.getElementById("pitchSlider"),
                    { start: [0], 
                      range: 
                      { 'min': [ -Math.PI / 6 ], 
                        'max': [ Math.PI / 6 ]
                      },
                      connect: [true, false],
                      orientation: "vertical",
                      direction: 'rtl',
                      animate: false
                    });
  values.pitch = document.getElementById("pitchSliderValue").firstChild;

  interfaces.height = noUiSlider.create(document.getElementById("heightSlider"),
                    { start: [0], 
                      range: 
                      { 'min': [ 0.0 ], 
                        'max': [ 1.0 ]
                      },
                      connect: [true, false],
                      orientation: "vertical",
                      direction: 'rtl',
                      animate: false
                    });
  values.height = document.getElementById("heightSliderValue").firstChild;

  interfaces.thrust = noUiSlider.create(document.getElementById("thrustSlider"),
                    { start: [0], 
                      range: 
                      { 'min': [ 0 ], 
                        'max': [ 1000 ]
                      },
                      step: 1,
                      connect: [true, false],
                      orientation: "vertical",
                      direction: 'rtl',
                      animate: false
                    });
  values.thrust = document.getElementById("thrustSliderValue").firstChild;

  /** Create airplane icons for obstacles. */
  for(var i = 0; i < OBSTACLE_COUNT; i++){
    var newDOM = document.createElement("img");
    newDOM.src = "https://maxcdn.icons8.com/office/PNG/16/Transport/airport-16.png";
    newDOM.width = 16;
    newDOM.style.position = "absolute";
    newDOM.style.zIndex = 10;
    newDOM.style.visibility = "hidden";
    document.getElementById("positionDOM").appendChild(newDOM);
    airplaneIcons.push(newDOM);
  }

}

/** 
 *  Handle key presses.
 *  @param {event object} event
 */
function handleKeyDown(event) {
  currentlyPressedKeys[event.keyCode] = true;

  /** Toggle thrust if C or J is pressed. */
  if(event.keyCode == 67 || event.keyCode == 74){
    reverse = !reverse;
    var button = document.getElementById("reverseButton");
    button.style.borderStyle = (button.style.borderStyle!=='inset' ? 'inset' : 'outset');
  }

}

/** 
 *  Handle key releases.
 *  @param {event object} event
 */
function handleKeyUp(event) {
  currentlyPressedKeys[event.keyCode] = false;
}

/** Update the interface. */
function interfaceUpdate() {

  /** Set values of interfaces. */
  var velocity = getIfVelocityOppositeToLookat() ? -getHorizontalVelocity() : getHorizontalVelocity();
  
  interfaces.velocity.set( velocity );
  values.velocity.nodeValue = (velocity*10000).toFixed(2) + " knots";
  
  interfaces.fuel.set( 1.0 - ( Date.now() - startTime ) / TIMEOUT );
  values.fuel.nodeValue = ((1.0 - ( Date.now() - startTime ) / TIMEOUT)*100).toFixed(2) + "%";
  
  interfaces.roll.set( getRoll() );
  values.roll.nodeValue = (getRoll()>=0?"+":"") + radToDeg(getRoll()).toFixed(2) + " deg";
  
  interfaces.pitch.set( getPitch() );
  values.pitch.nodeValue = (getPitch()>=0?"+":"") + radToDeg(getPitch()).toFixed(2) + " deg";
  
  interfaces.height.set( viewOrigin[2] );
  values.height.nodeValue = (viewOrigin[2]*10000).toFixed(2) + " feet";
  
  /** Increment/decrement thrust if necessary. */
  if(currentlyPressedKeys[88] || currentlyPressedKeys[76]){
    /** If X or L is pressed. */
    interfaces.thrust.set( parseFloat(interfaces.thrust.get()) + 5 );
  }else if(currentlyPressedKeys[90] || currentlyPressedKeys[75]){
    /** If Z or K is pressed. */
    interfaces.thrust.set( parseFloat(interfaces.thrust.get()) - 5 );
  }
  
  /** Calculate and update thrust based on slider value. */
  thrust = parseFloat(interfaces.thrust.get()) / 1000 * (reverse ? (getIfVelocityOppositeToLookat() ? -0.2 : -1.6) : 1.0);
  values.thrust.nodeValue = (thrust>=0?"+":"-") + (parseFloat(interfaces.thrust.get())/10.0).toFixed(1) + "%";

  /** Update compass' location and direction. */
  interfaces.orientation.style.transform = "rotate(" + radToDeg( getOrientation() ) + "deg)";
  interfaces.orientation.style.left = ((viewOrigin[0]+1.0)/2.0*200-12) + "px";
  interfaces.orientation.style.top = ((1.0-viewOrigin[1])/2.0*200-12) + "px";

  /** Update obstacles' locations and directions. */
  for(var i = 0; i < OBSTACLE_COUNT; i++){
    airplaneIcons[i].style.transform = "rotate(" + (-radToDeg( obstacleAngle[i] )) + "deg)";
    airplaneIcons[i].style.left = ((obstacleOrigin[i][0]+1.0)/2.0*200-8) + "px";
    airplaneIcons[i].style.top = ((1.0-obstacleOrigin[i][1])/2.0*200-8) + "px";
  }

}

/** Show messgae on message board. 
 *  @param {string} text
 *  @param {function|null} callback callback function after the text is shown.
 */
function msg(text, callback){
  msgDOM.nodeValue = text;
  if(callback){
    setTimeout(callback,0);
  }
}

/** Set obstacle level.
 *  @param {int} level none=0, static=1, moving=2
 */
function setObstacleLevel(level){
  obstacleLevel = level;
  /** Update visibility of airplane icons. */
  if(level === 0){
    for(var i = 0; i < OBSTACLE_COUNT; i++){
      airplaneIcons[i].style.visibility = "hidden";
    }
  }else{
    for(var i = 0; i < OBSTACLE_COUNT; i++){
      airplaneIcons[i].style.visibility = "visible";
    }
  }
}