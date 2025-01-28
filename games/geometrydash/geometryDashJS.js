
/*
Geometry dash

Abhi Jain

December 20th, 2018

The geometry dash game is one where the player goes through a course composed of blocks and spikes. They try to avoid the spikes, 
but there are several twists, such as blocks and spikes that move, the camera freezing, changing speed, changing the effects of gravity on the player, 
and chaing the control method of the player. Thjere are also some cool effects, such as the color of blocks fading and changing.

The main thing about this program is that I wanted the levels to not be hardcoded, instead I wanted to be able to build my 
own levels with custom layouts, animations, and colors simply by changing some variables. Therefore I wrote everything in the most general 
terms I could, and created a code system which let me build my own levels. The code system was composed of 5 variables:

platarray: the array containing the codes which tell how to build the level
animOrder: the array that controls the parameters for animated (moving) blocks
portalOrder: the array that contains the order of the functionality of each portal in the level
globalColor: the color palette for the level
messages: the different text bits displayed in the level

And now, a legend of what each letter in a code does:

b- adds a standard block (no animation)
s- adds a standard spike
S- adds a half-height spike
B- adds a blue ring, which changes the gravity direction when the player interacts with it
M- a block with an animation going up
m- a block with an animation going down
W- a spike with an animation going up
w- a spike with an animation going down
0- an empty space 30 px tall
R- a yellow ring which lets the player jump
T- a text message
p- a portal

there are also several events:

colorChange:#XXXXXX- changes the color of all non-animated blocks instantly to the provided hex code #XXXXXX
colorChanGe:#XXXXXXYYY- changes the color of all non-animated blocks with a fade whose time taken is YYY, to the provided hex code #XXXXXX
colorChange1:#XXXXXX- changes the color of all animated blocks instantly to the provided hex code #XXXXXX
colorChanGe1:#XXXXXXYYY- changes the color of all animated blocks with a fade whose time taken is YYY, to the provided hex code #XXXXXX
bgchange:#XXXXXX- changes the color of the background instantly to the provided hex code #XXXXXX
bgchanGe:#XXXXXXYYY- changes the color of the background with a fade whose time taken is YYY, to the provided hex code #XXXXXX
cgchange:#XXXXXX- changes the color of the ground instantly to the provided hex code #XXXXXX
cgchanGe:#XXXXXXYYY- changes the color of the ground with a fade whose time taken is YYY, to the provided hex code #XXXXXX
staticCamera- the blocks cease to move toward the player and instead the player moves forward into them, when the player reaches close to the end of the screen the map is restored and the player moves back to its initial position
texture:X- changes the image displayed for a block to the list item X-
end- signals the end of the level

These codes are interpreted by the buildmap() function.

Using these codes, I can build many different kinds of levels. This system is extremely inaccurate in comparison to the real game, which has a full-feature level editor with thousands of textures, resizing options, rotating algorithms, animation patters, and effects. A code system was the best I could do to avoid making something like that, which I didn;t really want to do. 


*/
var myCanvas = $("#myCanvas"); //getting canvas
var disp = myCanvas.get(0).getContext("2d");
//adding event listeners
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousedown", mouseDownHandler, false);

//Variable declaration---------------------------------------------------------------------------------------------------------------------------------------------------------- 

//note: the descriptions for a lot of these will make sense later on

let dots = []; //array of dots which player spawns
let platarray; //level layout and events
let animOrder; //level animation parameters
let portalOrder; //level portal function parameters
let staticCamera = false; //whether camera is moving or not
let override= false; //whether to override the build x coordinate limit
let currentTexture = 0; //block texture determinant
let stopid; //id for main program timer
let start = true; //whether the level is at the start
let percentage = 0; //length of level 
let percentDone = 0; //amount of level completed by user
let yHit = false; //checking if the block of a particular column were accounted for by the percentage check
let currentPercent = 0; //what percent the user is at
let currentPortal = -1; //the current portal whose function is to be assigned
var opaque = false; //boolean to display rules popup in HTML doc or not
let currentAnim = 0; //which animation to assign blocks
let numberOfThisAnim = 0; //number of blocks being assigned the current animation parametes
let end = false; //whether user has beaten level
let coefficientOfSpeed = 4; //default speed of blocks
let spikeTexture = []; //different textures for spikes
let attempts = 1; //attempts user takes at level
//basic animation template function
let animParam = [[function animUp(platform, dy, speed){ //parameters are block, distance it must move, rate at which it moves
					if (!(platform.y <= platform.prevY - dy) && !(platform.animDone)){ // if animation is not done yet
					//carry out animation
						platform.y -= speed;
						platform.rect.move(platform.x, platform.y); //moving collision object
					} else if (!(platform.animDone) && (platform.y <= platform.prevY - dy)){ //finsihing animation
						platform.animDone = true; 
					}
				}, 0,0,0], //other 3 are (respectively) distance to be moved, rate per frame, which x to trigger animation at
				//the follwing is the same function, modified for block going in the opposite direction
				[function animDown(platform, dy, speed){
					if (!(platform.y >= platform.prevY + dy) && !(platform.animDone)){
						platform.y += speed;
						platform.rect.move(platform.x, platform.y);
					} else if (!(platform.animDone) && (platform.y >= platform.prevY + dy)){
						platform.animDone = true;
					}
				}, 0,0,0]];
let x = 480 //x at which blocks are spawned
let theY = 0 //y of blocks being spawned
let theplatform = [] //array of all blocks
let jump = false //player movement determinant (move up or down)
let someNum = 0; //maps the next set of blocks to spawn
let genMap = true; //whether to continue the building of the map or not
let player; //what the user controls
let globalColor; //color palette
let eventQueue = [] //different events in level- color changes, etc (though not animations)
let stop = false; //used to control static camera animations
let id; //animation id
let id2; //another animation id
let loopitr = 0; //amount of times gone through restoration animation after static camera
let endstatic = false; //whether the restoration animation is running or not
let number = 0; //timing
let bgx = 0; //x of background
let gx = 0; //x of ground image
let currentLevel = 0; //which level the user is playing
let paused = false; //whether the game is paused
let toggleCollision = true; //whether collision is enabled or not
let currentM = 0; //which message to display
let messages = []; //messages to display

//game functions and classes----------------------------------------------------------------------------------------------------------------------------------------------------------

/*
------------------------------------------------------
| The colorGradient function calculates the 		 |
| color which is X percent between 2 endpoint colors.|
| this is used for color fades.						 |
------------------------------------------------------
*/

function colorGradient(fadeFraction, hex, hex2) {
    hex = hex.replace('#','');
	hex2 = hex2.replace('#','');
    let color1 = [parseInt(hex.substring(0,2), 16), parseInt(hex.substring(2,4), 16),parseInt(hex.substring(4,6), 16)];
	let color2 = [parseInt(hex2.substring(0,2), 16), parseInt(hex2.substring(2,4), 16),parseInt(hex2.substring(4,6), 16)];
	//console.log(color1, color2);
    var fade = fadeFraction;
    var diffRed = color2[0] - color1[0];
    var diffGreen = color2[1] - color1[1];
    var diffBlue = color2[2] - color1[2];
    var gradient = {
		red: parseInt(Math.floor(color1[0] + (diffRed * fade)), 10),
		green: parseInt(Math.floor(color1[1] + (diffGreen * fade)), 10),
		blue: parseInt(Math.floor(color1[2] + (diffBlue * fade)), 10),
    };
    let rgb = [gradient.red,gradient.green,gradient.blue];
	//console.log(rgb);
	var hex = Number(rgb[0]).toString(16);
	var hex1 = Number(rgb[1]).toString(16);
	var hex2 = Number(rgb[2]).toString(16);
	if (hex.length ==1){
		hex = "0" + hex;
	} if (hex1.length ==1){
		hex1 = "0" + hex1;
	} if (hex2.length ==1){
		hex2 = "0" + hex2;
	} 
	return "#"+hex+hex1+hex2;
}

/*
-------------------------------------------------------------------------------------------------------
| The Event class is used to deploy and time event which occur in the game while the level is playing.|
-------------------------------------------------------------------------------------------------------
*/

class event1 {
	constructor(color,x, toChange, grad, gradCount, beginning, end){
		this.color = color;
		this.toChange = toChange;
		this.x = x;
		this.grad = grad;
		this.gradCount = gradCount;
		this.gradientIter = 0;
		this.beginning = beginning;
		this.end = end;
		//console.log(this.x);
		/*
		if (this.grad!=undefined){
			console.log("It works!!!!!", this.gradCount, this.beginning, this.end, this.x);
		}
		*/
		this.pickedColor = false;
	}
	move(speed){
		if (this.x > 240){
			this.x -= speed;
			/*if (this.color == "end"){
				console.log(this.x, "end");
			}*/
		}
		if (this.color != "staticCamera" && this.color != "end" && this.color != "texture"){
			if ((this.x <= 240 || (player.x > this.x && staticCamera)) && this.grad == undefined){
				globalColor[this.toChange] = this.color;
				eventQueue.splice(this, 1);
			} else if ((this.x <= 240 || (player.x > this.x && staticCamera)) && this.grad != undefined && this.gradientIter <= this.gradCount){
				if (!(this.pickedColor)){
					this.pickedColor = true;
					this.beginning = globalColor[this.toChange]
				}
				//console.log("This is happening!!!!!!");
				globalColor[this.toChange] = colorGradient((this.gradientIter*100/this.gradCount)/100, this.beginning, this.end);
				//console.log(globalColor[this.toChange]);
				this.gradientIter++;
				if (this.gradientIter == this.gradCount){
					eventQueue.splice(this, 1);
				}
			}
		} else if (this.color == "staticCamera" && (this.x <= 240 || (player.x > this.x && staticCamera))){
			staticCamera=true;
			override = true;
			eventQueue.splice(this, 1);
		} else if (this.color == "end" && (this.x <= 240 || (player.x > this.x && staticCamera))){
			end = true;
			console.log("end");
			eventQueue.splice(this, 1);
		} else if (this.color == "texture" && (this.x <= 240 || (player.x > this.x && staticCamera))){
			currentTexture = this.toChange;
			eventQueue.splice(this, 1);
		}
	}
}

/*
-----------------------------------------------------------------------------------------
| The KeyDownHandler function handles all key events in the game, mostly player control.|						 |
-----------------------------------------------------------------------------------------
*/

function keyDownHandler(e){
	if (e.keyCode == 32){
		if (player.signature != 3 && player.signature != 2){
			jump = true;
			player.returnToZero = false;
		} else if (player.signature == 3) {
			if (player.gravityDir == "down" && player.intersectsDown){
				player.gravityDir = "up"
				player.gravity = 0;
			} else if (player.gravityDir == "up" && player.intersectsUp){
				player.gravityDir = "down"
				player.gravity = 0;
			}
			player.active = true;
		} else if (player.signature == 2){
			if (player.gravityDir == "down"){
				player.gravity = -5.6;
			} else {
				player.gravity = 5.6
			}
			if (player.intersectsDown && player.gravityDir == "down"){
				player.y -= 10;
				player.intersectsDown = false;
			} else if (player.intersectsUp && player.gravityDir == "up"){
				player.y += 10;
				player.intersectsUp = false;
			}
		}
	} else if (e.keyCode == 77){
		toggleCollision = false;
		coefficientOfSpeed = 12;
	} else if (e.keyCode == 27 && paused){
		paused = false
	} else if (e.keyCode == 27 && !paused){
		paused = true
	}
}

/*
------------------------------------------------------------------------------------------------------------
| The KeyUpHandler function handles any reason where the key up is needed. This is also for player control.|
------------------------------------------------------------------------------------------------------------
*/

function keyUpHandler(e){
	if (e.keyCode == 32){
		jump = false;
		player.returnToZero = true;
		if (player.signature == 3){
			player.active = false;
		}
	} else if (e.keyCode == 77){
		toggleCollision = true;
		coefficientOfSpeed = 4;
	}
}

/*
-------------------------------------------------------------------------------------------------------
| The MouseDwnHandler function handles any mouse clicking for the pause  and level won menu           |
-------------------------------------------------------------------------------------------------------
*/

function mouseDownHandler(e){
	var rect = myCanvas.get(0).getBoundingClientRect();
	//console.log(e.clientX- rect.left, e.clientY - rect.top);
	if (e.clientX - rect.left > 800 && e.clientX - rect.left < 820 && e.clientY - rect.top > 0 && e.clientY -rect.top < 20){
		paused = true;
	} else if (e.clientX - rect.left > 420 && e.clientX - rect.left < 610 && e.clientY - rect.top > 190 && e.clientY -rect.top < 330 && paused){
		paused = false;
	} else if (e.clientX - rect.left > 420 && e.clientX - rect.left < 610 && e.clientY - rect.top > 190 && e.clientY -rect.top < 330 && end){
		resetGame();
		theplatform.push(new platform(-40, 399+30, 860, 150, 0, 0));
		theplatform.push(new platform(-40, 399-420, 860, 150, 0, 0));
	} else if (e.clientX - rect.left > 270 && e.clientX - rect.left < 370 && e.clientY - rect.top > 227 && e.clientY -rect.top < 293 && (paused || end)){
		window.clearInterval(stopid);
		resetGame();
		paused = false;
		//platarray = undefined;
		$("#myCanvas").hide(500);
		$("#buttons").show(500);
	}
}

/*
-------------------------------------------------------------------------------------------------------
| The platform class represents any block or spikes which are in the level. It contains code for their| 
| animation, and moving towards the player. 														  |
-------------------------------------------------------------------------------------------------------
*/

class platform {
    constructor(x, y, dx, dy, spike, anim, character, img){
        this.spike = spike;
        this.x = x;
        this.trueY = y;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.animDone = false;
		this.anim = anim;
		this.img = img
		this.code = "yeet";
		this.prevY = this.y;
		this.character = character;
		if (animOrder[currentAnim].length == 5 && this.anim != 0){
			if (animOrder[currentAnim][4] == "final"){
				if (this.character == "M" || this.character == "W"){
					this.y += this.anim[1];
				} else if (this.character == "m" || this.character == "w"){
					this.y -= this.anim[1];
				}
			} else if (animOrder[currentAnim][4] == "finalDown"){
				if (this.character == "M" || this.character == "W"){
					this.y += this.anim[1];
				}
			} else if (animOrder[currentAnim][4] == "finalUp"){
				if (this.character == "m" || this.character == "w"){
					this.y -= this.anim[1];
				}
			}
			this.prevY = this.y;
		}
		this.rect = new rect(this.x, this.y, dx, dy, 0);
	}
	move(speed){
		this.x -=speed;
		this.rect.move(this.x, this.y);
	}
	runAnim(){
		if (this.x < this.anim[3] && !(this.animDone)){
			this.anim[0](this, this.anim[1], this.anim[2]);
		}
	}
	drawthis(){
		if (this.spike == 0 && theplatform.indexOf(this) > 1){
			if (this.character == "m" || this.character == "M"){
				disp.fillStyle = globalColor[1];
			} else {
				disp.fillStyle = globalColor[0];
			}
			disp.fillRect(this.x, this.y, this.dx, this.dy);
			disp.drawImage(document.getElementById(this.img.toString(10)), this.x, this.y, this.dx, this.dy);
		} else if (this.spike == 1){
			disp.drawImage(spikeTexture[0], this.x, this.y, this.dx, this.dy);
		} else if (this.spike == 2){
			disp.drawImage(spikeTexture[1], this.x, this.y, this.dx, this.dy);
		} else if (this.spike == 0 && theplatform.indexOf(this) == 0 || theplatform.indexOf(this) == 1){
			disp.fillStyle = globalColor[3];
			disp.fillRect(this.x, this.y, this.dx, this.dy);
		}
	}
}

/*
-------------------------------------------------------------------------------------------------------------------------------------------------------------------
| The Rect class is not visible. It is the basis on which all collision detection is made possible, by testing for intersection in various cases with other rects.|
-------------------------------------------------------------------------------------------------------------------------------------------------------------------
*/

class rect {
	constructor(x, y, dx, dy){
		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
	}
	intersectsDown(rect){
		 return (this.x + this.dx > rect.x && this.x < rect.x + rect.dx && this.y + this.dy > rect.y && this.y < rect.y);
	}
	intersectsUp(rect){
		return (this.x + this.dx > rect.x && this.x < rect.x + rect.dx && this.y + this.dy > rect.y && this.y < rect.y + rect.dy);
	}
	intersectsSide(rect){
		return (this.x + this.dx >= rect.x && this.y > rect.y - rect.dy/2 && this.y < rect.y + rect.dy/2);
	}
	intersectsPortal(rect){
		return (this.x + this.dx >= rect.x && this.y > rect.y - 5 && this.y < rect.y + rect.dy + 5);
	}
	move(x, y){
		this.x = x;
		this.y = y;
	}
}

/*
-------------------------------------------------------------------------------------------------------------------------
| The Portal is a block which changes a certain game or player attirbute, such as level speed, or player control method.|
-------------------------------------------------------------------------------------------------------------------------
*/

class portal {
	constructor(x, y, dx, dy, func){
		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.code = 5;
		this.func = func;
		this.enabled = true;
		this.intersects = false;
		this.spike = 0;
		this.rect = new rect(this.x, this.y, this.dx, this.dy);
	}
	pfunction(){
		if (this.intersects && this.enabled){
			//console.log("functioned");
			if (this.func == 0){
				player.gravityDir = "up";
			} else if (this.func == 1){
				player.gravityDir = "down";
			} else if (this.func == 2){
				let currentX = player.x;
				let currentY = player.y
				player = new arrow(currentX, currentY, 4);
				player.rect.move(player.x, player.y)
			} else if (this.func == 3){
				let currentX = player.x;
				let currentY = player.y
				player = new space(currentX, currentY, 1);
				player.rect.move(player.x, player.y)
			} else if (this.func == 4){
				let currentX = player.x;
				let currentY = player.y
				player = new cycle(currentX, currentY, 3);
				player.rect.move(player.x, player.y)
			} else if (this.func == 6){
				player.y = this.y -150;
				player.rect.move(player.x, player.y)
			} else if (this.func == 7){
				player.y = this.y +150;
				player.rect.move(player.x, player.y)
			} else if (this.func == 8){
				let currentX = player.x;
				let currentY = player.y
				player = new ufo(currentX, currentY, 2);
				player.rect.move(player.x, player.y)
			} else if (this.func == 9){
				coefficientOfSpeed = 5;
			} else if (this.func == 10){
				coefficientOfSpeed = 4;
			}
			this.enabled = false;
			player.die = false;
		}
	}
	move(speed){
		this.x -= speed;
		this.rect.move(this.x, this.y);
	}
	drawthis(){
		disp.drawImage(document.getElementById("portalLeft"), this.x, this.y + 2, 30, 86);
		if (this.func == 6){
			disp.drawImage(document.getElementById("portalRight"), this.x, this.y - 148, 30, 86);
		} else if (this.func == 7){
			disp.drawImage(document.getElementById("portalRight"), this.x, this.y + 152, 30, 86);
		}
	}
	runAnim(){
	}
}

/*
------------------------------------------------------------------
| The msg class is a simple text messages displayed in the level.|
------------------------------------------------------------------
*/

class msg {
	constructor(x, y, text1){
		this.x = x;
		this.y = y;
		this.text1 = text1;
		this.spike = 0;
		//console.log("text made");
	}
	move(speed){
		this.x -= speed;
	}
	drawthis(){
		disp.font = "24px Aldrich";
		disp.fillStyle = globalColor[0];
		disp.fillText(this.text1,this.x, this.y);
		//console.log("text drawn");
	}
	runAnim(){
	}
}

/*
----------------------------------------------------------------------
| The dot class is a simple circle which trails behind the character.|
----------------------------------------------------------------------
*/

class dot{
	constructor(x, y){
		this.x = x;
		this.y = y;
	}
	move(speed){
		this.x -=speed;
	}
	drawSelf(){
		disp.globalAlpha = 1- (player.x - this.x)/100
		if (1- (player.x - this.x)/100 <= 0){
			disp.globalAlpha = 0;
		}
		disp.fillStyle = globalColor[0];
		disp.beginPath();
		disp.arc(this.x, this.y, 5, 0, Math.PI*2);
		disp.fill();
		disp.globalAlpha = 1
	}
}

/*
----------------------------------------------------------------------------------
| The character class is the basis for all 4 different types of player control.  |
| It contains all the collision detection, variables, and movement choice logic. |
| All 4 control method classes inherit from it.								     |
----------------------------------------------------------------------------------
*/

class character {
	constructor(sig){
		this.x = 240
		this.y = 300
		this.gravity = 0
		this.gravityAcc = 0.28
		this.rect = new rect(this.x, this.y, 30, 30, 0)
		this.intersectsUp = false
		this.intersectsDown = false
		this.intersectCount = 0
		this.die = false
		this.gravityDir = "down"
		this.returnToZero = true
		this.dotGen = 0
		this.active = false;
		this.signature = sig;
		this.intersectsRing = false;
	}
	checkInit(){
		this.intersectCount = 0;
		this.intersectsUp = 0;
		this.intersectsDown = 0;
		this.intersectsRing = false;
	}
	collPortal(){
		let somePortals = theplatform.filter(rect => {
			return rect.code == 5;
		});
		let platforms = somePortals.length
		for (let i = 0; i < platforms; i++){
			somePortals[i].intersects = this.rect.intersectsPortal(somePortals[i].rect);
			somePortals[i].pfunction();
		}
	}
	collSide(){
		const someRects = theplatform.filter(rect => {
			return (rect.x > this.x && rect.x < this.x + 60) && rect.code === "yeet";
		});
		let platforms = someRects.length
		for (let i = 0; i < platforms; i++){
			if (this.rect.intersectsSide(someRects[i].rect)){
				this.die = true;
				;
				break;
			}
		}
	}
	collDown(){
		const pastRectsDown = theplatform.filter(rect => {
			return (theplatform.indexOf(rect) == 0) || ((rect.x + rect.dx > this.x || this.x +30 > rect.x) && rect.y > this.y && rect.code === "yeet");
		});
		let platforms = pastRectsDown.length
		for (let i = 0; i < platforms; i++){
			if (this.rect.intersectsDown(pastRectsDown[i].rect)){
				if (this.returnToZero){
					this.returntoZero = false;
					if (this.signature != 2  && this.signature != 3){
						this.y = pastRectsDown[i].y - 30;
						this.gravity = 0;
					}
					if (this.gravityDir == "up" && (this.signature == 2)){
						this.gravity = 0;
					} else if (this.gravityDir == "down" && this.signature == 3){
						this.gravity = 0;
					}
					this.rect.move(this.x, this.y);
				}
				this.intersectCount++;
				if (pastRectsDown[i].spike > 0){
					this.die = true;
					;
					break;
				}
			} 
		}
		if (this.intersectCount > 0){
			this.intersectsDown = true;
		}
	}
	collUp(){
		this.intersectCount = 0;
		const pastRectsUp = theplatform.filter(rect => {
			return (theplatform.indexOf(rect) == 1) || ((rect.x + rect.dx > this.x || this.x +30 > rect.x) && rect.y < this.y && rect.code === "yeet");
		});
		let platforms = pastRectsUp.length
		for (let i = 0; i < platforms; i++){
			if (this.rect.intersectsUp(pastRectsUp[i].rect)){
				if (this.returnToZero){
					this.returntoZero = false;
					if (this.signature != 2 && this.signature != 3){
						this.y = pastRectsUp[i].y + 30;
						this.gravity = 0;
					}
					if (this.gravityDir == "down" && this.signature == 2){
						this.gravity = 0;
					} else if (this.gravityDir == "up" && this.signature == 3){
						this.gravity = 0;
					}
					this.rect.move(this.x, this.y);
				}
				this.intersectCount++;
				if (pastRectsUp[i].spike > 0){
					;
					this.die = true;
					break;
				}
			}
		}
		if (this.intersectCount > 0){
			this.intersectsUp = true;
		}
	}
	collRing(){
		const someRings = theplatform.filter(rect => {
			return typeof rect.code == "boolean";
		});
		let platforms = someRings.length
		for (let i = 0; i < platforms; i++){
			//console.log(someRings[i].enabled, this.active, this.gravity);
			if ((this.rect.intersectsDown(someRings[i].rect) || this.rect.intersectsUp(someRings[i].rect)) && this.active && someRings[i].enabled){
				someRings[i].rfunction();
			}
		}
	}
	collFinish(){
		if (this.y >= 399){
			this.intersectsDown = true;
			this.y = 399;
		} else if (this.y <= 129){
			this.intersectsUp = true;
			this.y = 129;
		}
	}
	check(){
		this.checkInit();
		this.collPortal();
		this.collSide();
		this.collDown();
		this.collUp();
		this.collRing();
		this.collFinish();
	}
	moveSelect(){
		if (toggleCollision){
			this.check();
		}
		if (this.gravityDir == "down"){
			this.moveDown();
		} else {
			this.moveUp();
		}
	}
}

/*
-------------------------------------------------------------------
| The space class is the basic maethod for controlling the player.|
-------------------------------------------------------------------
*/

class space extends character{
	constructor(x, y){
		super();
		this.x = x;
		this.y = y;
		this.signature = 1;
	}
	moveUp(){
		if (!(this.die)){
			if (!(jump) && this.y > 100 && !(this.intersectsUp)){
				this.gravity -= this.gravityAcc;
				this.y += this.gravity;
			} else if (jump && this.y < 400 && !(this.intersectsDown)){
				this.gravity += this.gravityAcc;
				this.y += this.gravity;
			}
			this.rect.move(this.x, this.y);
			this.dotGen++;
			if (this.dotGen % 6 == 0){
				dots.push(new dot(this.x + 15, this.y + 15));
			}
		}
	}
	moveDown(){
		if (!(this.die)){
			if (jump && this.y > 100 && !(this.intersectsUp)){
				this.gravity -= this.gravityAcc;
				this.y += this.gravity;
			} else if (!(jump) && this.y < 400 && !(this.intersectsDown)){
				this.gravity += this.gravityAcc;
				this.y += this.gravity;
			}
			this.rect.move(this.x, this.y);
			this.dotGen++;
			if (this.dotGen % 6 == 0){
				dots.push(new dot(this.x + 15, this.y + 15));
			}
		}
	}
	draw(){
		disp.fillStyle = "#00FFF2";
		disp.fillRect(this.x, this.y, 30, 30);
		if (this.gravityDir == "down"){
			disp.drawImage(document.getElementById("player"), this.x, this.y, 30, 30);
		} else {
			disp.drawImage(document.getElementById("invPlayer"), this.x, this.y, 30, 30);
		}
		
	}	
}

/*
---------------------------------------------------------------------
| The ufo class is a jumping-based method of controlling the player.|
---------------------------------------------------------------------
*/

class ufo extends character {
	constructor(x, y){
		super();
		this.x = x;
		this.y = y;
		this.signature = 2;
	}
	moveUp(){
		if (!(this.die)){
			if (this.y < 100){
				this.gravity = 0;
				this.intersectsUp = true;
			} else if (this.y > 400){
				this.gravity = 0;
				this.intersectsDown = true;
			}
			if (!(this.intersectsDown) && this.intersectsUp){
			} else if (!(this.intersectsUp) && this.intersectsDown){
				this.gravity -= this.gravityAcc;
				this.y += this.gravity;
			} else if (!(this.intersectsUp)){
				this.gravity -= this.gravityAcc;
				this.y += this.gravity;
			} else if (!(this.intersectsDown)){
				this.gravity -= this.gravityAcc;
				this.y += this.gravity;
			} 
			this.rect.move(this.x, this.y);
			this.dotGen++;
			if (this.dotGen % 6 == 0){
				dots.push(new dot(this.x + 15, this.y + 15));
			}
		}
	}
	moveDown(){
		if (!(this.die)){
			if (this.y < 100){
				this.gravity = 0;
				this.intersectsUp = true;
			} else if (this.y > 400){
				this.gravity = 0;
				this.intersectsDown = true;
			}
			if (!(this.intersectsUp) && this.intersectsDown){
			} else if (!(this.intersectsDown) && this.intersectsUp){
				this.gravity += this.gravityAcc;
				this.y += this.gravity;
			} else if (!(this.intersectsUp)){
				this.gravity += this.gravityAcc;
				this.y += this.gravity;
			} else if (!(this.intersectsDown)){
				this.gravity += this.gravityAcc;
				this.y += this.gravity;
			} 
			this.rect.move(this.x, this.y);
			this.dotGen++;
			if (this.dotGen % 6 == 0){
				dots.push(new dot(this.x + 15, this.y + 15));
			}
		}
	}
	draw(){
		disp.fillStyle = "#00FFF2";
		disp.fillRect(this.x+7.975, this.y, 15.95, 15.95);
		disp.drawImage(document.getElementById("player"), this.x+7.975, this.y, 15.95, 15.95);
		disp.drawImage(document.getElementById("ufo"), this.x, this.y+15.95, 30, 14.05);
	}
}

/*
-----------------------------------------------------------------------
| The cycle class is a gravity-based method of controlling the player.|
-----------------------------------------------------------------------
*/

class cycle extends character {
	constructor(x, y){
		super();
		this.x = x;
		this.y = y;
		this.gravityAcc = 0.37
		this.signature = 3;
	}
	moveSelect(){
		if (toggleCollision){
			this.check();
		} 
		this.move();
	}
	move(){
		if (!(this.die)){
			if (this.y > 100 && !(this.intersectsUp) && this.gravityDir == "up"){
				this.gravity -= this.gravityAcc;
				this.y += this.gravity;
			} else if (this.y < 400 && !(this.intersectsDown) && this.gravityDir == "down"){
				this.gravity += this.gravityAcc;
				this.y += this.gravity;
			}
			this.rect.move(this.x, this.y);
			dots.push(new dot(this.x + 15, this.y + 15));
		}
	}
	draw(){
		disp.drawImage(document.getElementById("ball"), this.x, this.y, 30, 30);
	}
}

/*
-----------------------------------------------------------------------------------------
| The arrow class is a linear method of controlling the player.                         |
| It is extremely sensitive and does not allow the player to touch any object on screen.|
-----------------------------------------------------------------------------------------
*/

class arrow extends character {
	constructor(x, y){
		super();
		this.x = x;
		this.y = y;
		this.gravityAcc = 5;
		this.signature = 4;
	}
	check(){
		this.intersectCount = 0;
		this.intersectsUp = 0;
		this.intersectsDown = 0;
		const somePortals = theplatform.filter(rect => {
			return typeof rect.code == "number";
		});
		let platforms = somePortals.length
		for (let i = 0; i < platforms; i++){
			somePortals[i].intersects = this.rect.intersectsSide(somePortals[i].rect);
			somePortals[i].pfunction();
		}
		const someRects = theplatform.filter(rect => {
			return (rect.x > this.x - 25) && typeof rect.code == "string";
		});
		platforms = someRects.length
		for (let i = 0; i < platforms; i++){
			if (this.rect.intersectsSide(someRects[i].rect) || this.rect.intersectsDown(someRects[i].rect) || this.rect.intersectsUp(someRects[i].rect)  && !endstatic){
				this.die = true;
				break;
			}
		}
	}
	moveUp(){
		this.gravity = 5;
		if (!(jump) && this.y > 100){
			this.y -= this.gravity;
		} else if (jump && this.y < 400){
			this.y += this.gravity;
		}
		this.rect.move(this.x, this.y);
		dots.push(new dot(this.x + 12.5, this.y + 12.5));
	}
	moveDown(){
		this.gravity = 5;
		if (jump && this.y > 100){
			this.y -= this.gravity;
		} else if (!(jump) && this.y < 400){
			this.y += this.gravity;
		}
		this.rect.move(this.x, this.y);
		dots.push(new dot(this.x + 12.5, this.y + 12.5));
	}
	draw(){
		disp.fillStyle = "#00FFF2";
		disp.fillRect(this.x, this.y, 25, 25);
		disp.drawImage(document.getElementById("player"), this.x, this.y, 25, 25);
	}
}

/*
--------------------------------------------------------------------------
| The ring class is an object that allows the different classes to jump. |
--------------------------------------------------------------------------
*/

class ring {
	constructor(x, y, func){
		this.x = x;
		this.y = y;
		this.code = true;
		this.func = func;
		this.spike = 0;
		this.rect = new rect(this.x, this.y, 30, 30);
		this.enabled = true;
	}
	move(speed){
		this.x -= speed;
		this.rect.move(this.x, this.y);
	}
	rfunction(){
		if (this.func == 0){
			if (player.gravityDir == "down"){
				player.gravity = -6
			} else {
				player.gravity = 6
			}
		} else {
			if (player.gravityDir == "down"){
				player.gravity = -3.4
				player.gravityDir = "up"
			} else {
				player.gravity = 3.4
				player.gravityDir = "down"
			}
		}
		this.enabled = false;
	}
	drawthis(){
		if (this.func == 0){
			disp.drawImage(document.getElementById("ring"), this.x+5, this.y+5, 20, 20);
		} else {
			disp.drawImage(document.getElementById("bluering"), this.x+5, this.y+5, 20, 20);
		}
	}
	runAnim(){
	}
}

/*
-----------------------------------------------------------------------------------------------------
| The buildmap function spawns all objects with their coordinates and any extra function they have. |
-----------------------------------------------------------------------------------------------------
*/

function buildMap(){
	for (let k = someNum; k < platarray.length; k++){
		if (platarray[k].includes("colorChange:")){
			let aColor = "";
			for (let i = 12; i < 19; i++){
				aColor += platarray[k][i]
			}
			eventQueue.push(new event1(aColor,x, 0));
			someNum = k + 1;
			break;
		} else if (platarray[k].includes("colorChange1:")){
			let aColor = "";
			for (let i = 13; i < 20; i++){
				aColor += platarray[k][i]
			}
			eventQueue.push(new event1(aColor,x, 1));
			someNum = k + 1;
			break;
		} else if (platarray[k].includes("colorChanGe:")){
			let aColor = "";
			let aCount = "";
			for (let i = 12; i < 19; i++){
				aColor += platarray[k][i]
			}
			for (let i = 19; i < 22; i++){
				aCount += platarray[k][i]
				//console.log(platarray[k][i], aCount);
			}
			aCount = parseInt(aCount);
			//console.log(aCount);
			eventQueue.push(new event1(aColor,x, 0, 0, aCount, globalColor[0], aColor));
			someNum = k + 1;
			break;
		} else if (platarray[k].includes("colorChanGe1:")){
			let aColor = "";
			let aCount = "";
			for (let i = 13; i < 20; i++){
				aColor += platarray[k][i]
			}
			for (let i = 20; i < 23; i++){
				aCount += platarray[k][i]
				//console.log(platarray[k][i], aCount);
			}
			aCount = parseInt(aCount);
			//console.log(aCount);
			eventQueue.push(new event1(aColor,x, 1, 0, aCount, globalColor[0], aColor));
			someNum = k + 1;
			break;
		} else if (platarray[k].includes("bgchange:")){
			let aColor = "";
			for (let i = 9; i < 16; i++){
				aColor += platarray[k][i]
			}
			eventQueue.push(new event1(aColor,x, 2));
			someNum = k + 1;
			break;
		} else if (platarray[k].includes("bgchanGe:")){
			let aColor = "";
			let aCount = "";
			for (let i = 9; i < 16; i++){
				aColor += platarray[k][i]
			}
			for (let i = 16; i < 19; i++){
				aCount += platarray[k][i]
				//console.log(platarray[k][i], aCount);
			}
			aCount = parseInt(aCount);
			//console.log(aCount);
			eventQueue.push(new event1(aColor,x, 2, 0, aCount, globalColor[2], aColor));
			someNum = k + 1;
			break;
		} else if (platarray[k].includes("cgchange:")){
			let aColor = "";
			for (let i = 9; i < 16; i++){
				aColor += platarray[k][i]
			}
			eventQueue.push(new event1(aColor,x, 3));
			someNum = k + 1;
			break;
		} else if (platarray[k].includes("cgchanGe:")){
			let aColor = "";
			let aCount = "";
			for (let i = 9; i < 16; i++){
				aColor += platarray[k][i]
			}
			for (let i = 16; i < 19; i++){
				aCount += platarray[k][i]
				//console.log(platarray[k][i], aCount);
			}
			aCount = parseInt(aCount);
			//console.log(aCount);
			eventQueue.push(new event1(aColor,x, 3, 0, aCount, globalColor[3], aColor));
			someNum = k + 1;
			break;
		} else if (platarray[k] == "staticCamera"){
			stop = false;
			eventQueue.push(new event1("staticCamera",820));
			someNum = k + 1;
			break;
		} else if (platarray[k] == "end"){
			eventQueue.push(new event1("end",820));
			platarray[k] = "b00000000b9"
			//console.log("lol");
			someNum = k + 1;
			break;
		} else if (platarray[k].includes("texture")){
			eventQueue.push(new event1("texture",820,parseInt(platarray[k][8])));
			someNum = k + 1;
			break;
		}
		if (!(staticCamera)){
			for (let i = 0; i < parseInt(platarray[k][platarray[k].length - 1]); i++){
				theY = 0;
				for (let j = 0; j < platarray[k].length - 1; j++){
					let char1 = platarray[k]
					let char2 = platarray[k][j]
					if (char2 == "b"){
						theplatform.push(new platform(x, 399 - theY, 30, 30, 0, 0, 0, currentTexture))
						theY += 30
					} else if (char2 == "s"){
						if (platarray[k][j+1] == "b" || theY == 270){
							theplatform.push(new platform(x, 399 - theY, 30, 30, 2, 0))
						} else {
							theplatform.push(new platform(x, 399 - theY, 30, 30, 1, 0))
						}
						theY += 30
					} else if (char2 == "S"){
						if (platarray[k][j+1] == "b" || platarray[k][j+1] == "S" || platarray[k][j+1] == "s" || theY == 270){
							theplatform.push(new platform(x, 399 - theY, 30, 15, 2, 0))
						} else {
							theplatform.push(new platform(x, 399 - theY + 15, 30, 15, 1, 0))
						}
						theY += 30
					} else if (char2 == "0"){
						theplatform.push(new platform(x,0,0,0,0,0,0,currentTexture));
						theY += 30
					} else if (char2 == "T"){
						theplatform.push(new msg(x, 399-theY, messages[currentM]));
						currentM++;
						theY += 30
					} else if (char2 == "R"){
						theplatform.push(new ring(x, 399-theY, 0));
						theY += 30
					} else if (char2 == "B"){
						theplatform.push(new ring(x, 399-theY, 1));
						theY += 30
					} else if (char2 == "p"){
						currentPortal++;
						theY += 60
						theplatform.push(new portal(x, 399 - theY, 30, 90, portalOrder[currentPortal]));
						theY += 30
					} else if (char2 == "m"){
						animParam[1][1] = animOrder[currentAnim][0]; animParam[1][2] = animOrder[currentAnim][1]; animParam[1][3] = animOrder[currentAnim][2];
						numberOfThisAnim++;
						theplatform.push(new platform(x, 399 - theY, 30, 30, 0, animParam[1], "m", currentTexture))
						theY += 30
					} else if (char2 == "M"){
						animParam[0][1] = animOrder[currentAnim][0]; animParam[0][2] = animOrder[currentAnim][1]; animParam[0][3] = animOrder[currentAnim][2];
						numberOfThisAnim++;
						theplatform.push(new platform(x, 399 - theY, 30, 30, 0, animParam[0], "M", currentTexture))
						theY += 30
					} else if (char2 == "w"){
						animParam[1][1] = animOrder[currentAnim][0]; animParam[1][2] = animOrder[currentAnim][1]; animParam[1][3] = animOrder[currentAnim][2];
						numberOfThisAnim++;
						if (platarray[k][j+1] == "b" || platarray[k][j+1] == "m"){
							theplatform.push(new platform(x, 399 - theY, 30, 30, 2, animParam[1],"w"))
						} else {
							theplatform.push(new platform(x, 399 - theY, 30, 30, 1, animParam[1],"w"))
						}
						theY += 30
					} else if (char2 == "W"){
						animParam[0][1] = animOrder[currentAnim][0]; animParam[0][2] = animOrder[currentAnim][1]; animParam[0][3] = animOrder[currentAnim][2];
						numberOfThisAnim++;
						if (platarray[k][j+1] == "b" || platarray[k][j+1] == "M"){
							theplatform.push(new platform(x, 399 - theY, 30, 30, 2, animParam[0],"W"))
						} else {
							theplatform.push(new platform(x, 399 - theY, 30, 30, 1, animParam[0],"W"))
						}
						theY += 30
					}
				}
				//console.log(numberOfThisAnim);
				if (numberOfThisAnim >= animOrder[currentAnim][3]){
					currentAnim++;
					numberOfThisAnim = 0;
				}
				x+=30;
			}
			if (x > 810){
				someNum = k + 1;
				if (!(override)){
					x = 840;
				}
				genMap = false;
				break;
			}
		}
	}
}

//from the interwebs
function delay(ms) {
	var cur_d = new Date();
	var cur_ticks = cur_d.getTime();
	var ms_passed = 0;
	while(ms_passed < ms) {
		var d = new Date();  // Possible memory leak?
		var ticks = d.getTime();
		ms_passed = ticks - cur_ticks;
		// d = null;  // Prevent memory leak?
	}
}

/*
-------------------------------------------------------------------------------
| The rebuild function is the restoring function after a static camera occurs.|
-------------------------------------------------------------------------------
*/

function rebuild(){
	number+=3;
	let sineMove = coefficientOfSpeed*4*(Math.sin(number*(Math.PI/180)))
	bgx -= sineMove/8;
	disp.globalAlpha = 0.4;
	disp.drawImage(document.getElementById("bg"),bgx, 129, 820, 300); 
	disp.drawImage(document.getElementById("bg"),bgx + 820, 129, 820, 300); 
	disp.globalAlpha = 1;
	gx -= sineMove;
	for (let i = 2; i < theplatform.length; i++){
		theplatform[i].move(sineMove);
		theplatform[i].drawthis();
	}
	for (let i = 0;  i < eventQueue.length; i++){
		eventQueue[i].move(sineMove);
	}
	for (let i = 0;  i < dots.length; i++){
		dots[i].move(sineMove);
	}
	player.x -= sineMove;
	player.rect.move(player.x, player.y);
	player.gravity = 0;
	if (loopitr%6==0){
		dots.push(new dot(player.x, player.y));
	}
	loopitr++
	if (player.x >= 240){
		//console.log("this is happening", loopitr)
		id2 = window.requestAnimationFrame(rebuild);
	} else {
		loopitr = 0;
		endstatic = false;
		window.cancelAnimationFrame(id2);
	}
}

/*
-----------------------------------------------------------------------------------------
| The rebuildmap function builds the map as a background process during a static camera.|
-----------------------------------------------------------------------------------------
*/

function reBuildMap(){
	buildMap();
	//console.log(x, staticCamera);
	if (x > 1660){
		x = 840;
		stop = true;			
	}
	//console.log(stop);
	if (!(stop)){
		//console.log("running");
		id = window.requestAnimationFrame(reBuildMap);
		//console.log(id);
	} else if (stop){
		//console.log("happoenb");
		endstatic = true;
		number = 0;
		rebuild();
		override = false;
		window.cancelAnimationFrame(id);
	}
}

/*
----------------------------------------------------------------------------------
| The box function draws a stylish box on the screen during pauses or at the end.|
----------------------------------------------------------------------------------
*/

function box(){
	disp.globalAlpha = 1.0;
	theplatform[0].drawthis();
	theplatform[1].drawthis();
	disp.fillStyle = "#000000";
	disp.fillRect(100, 40, 620, 350);
	disp.globalAlpha = 0.05;
	disp.drawImage(document.getElementById("bg"), 100, 40, 620, 350);
	disp.globalAlpha = 1;
	disp.fillStyle = "#00FF00";
	disp.fillRect(90, 50, 20, 110);
	disp.fillRect(710, 50, 20, 110);
	disp.fillRect(90, 270, 20, 110);
	disp.fillRect(710, 270, 20, 110);
	disp.fillRect(110, 30, 200, 20);
	disp.fillRect(510, 30, 200, 20);
	disp.fillRect(110, 370, 200, 20);
	disp.fillRect(510, 370, 200, 20);
	disp.fillStyle = "#42f4eb";
	disp.fillRect(80, 20, 30, 30);
	disp.fillRect(80, 370, 30, 30);
	disp.fillRect(310, 30, 200, 20);
	disp.fillRect(310, 370, 200, 20);
	disp.fillRect(90, 160, 20, 110);
	disp.fillRect(710, 160, 20, 110);
	disp.fillRect(710, 20, 30, 30);
	disp.fillRect(710, 370, 30, 30);
	disp.drawImage(document.getElementById("play"), 420, 190, 140, 140);
	disp.drawImage(document.getElementById("menu"), 270, 227, 100, 66);
}

/*
-------------------------------------------------------------
| The percent function draws the ground and the percent bar.|
-------------------------------------------------------------
*/

function percent(){
	disp.globalAlpha = 0.1;
	disp.drawImage(document.getElementById("bg"),gx, 0, 820, 129); 
	disp.drawImage(document.getElementById("bg"),gx + 820, 0, 820, 129); 
	disp.drawImage(document.getElementById("bg"),gx, 429, 820, 150); 
	disp.drawImage(document.getElementById("bg"),gx + 820, 429, 820, 150); 
	disp.globalAlpha = 1;
	disp.beginPath();
	disp.moveTo(0, 129);
	disp.lineTo(820,129);
	disp.stroke();
	disp.beginPath();
	disp.moveTo(0,429);
	disp.lineTo(820,429);
	disp.stroke();
	disp.font = "24px Arial";
	disp.fillStyle = "#000000";
	disp.fillText(currentPercent + "%", 7, 30);
	disp.fillStyle = "#FFFFFF";
	disp.fillRect(57, 10, 404, 24);
	disp.fillStyle = "#000000";
	disp.rect(57, 10, 404, 24);
	disp.stroke();
	for (let i = 0; i < currentPercent; i++){
		disp.fillStyle = colorGradient(i/100, "#000000", "#00FF00");
		disp.fillRect(58+i*4, 11, 4, 22);
	}
	disp.drawImage(document.getElementById("pause"), 800, 0, 20, 20);
}

/*
-----------------------------------------------------------------------------------------------------------
| The resetgame function rests all variables to their defaults when the player dies or the game is exited.|
-----------------------------------------------------------------------------------------------------------
*/

function resetGame(){
	theplatform = [];
	gx = 0;
	x = 480;
	window.cancelAnimationFrame(id);
	someNum = 0;
	dots = [];
	if (currentLevel == 1){
		globalColor = ["#00FF00", "#FF0000", "#D5DEED", "#A1ABBA"];
	} else if (currentLevel == 2){
		globalColor = ["#064912", "#888888", "#444444","#777777"];
	} else if (currentLevel == 3){
		globalColor = ["#AA00FF", "#00FF00", "#000000", "#444444"];
	}
	currentPortal = -1;
	eventQueue = []
	currentAnim = 0;
	currentPercent = 0;
	currentTexture = 0;
	numberOfThisAnim = 0;
	staticCamera = false;
	endstatic = false;
	genMap= true;
	yHit = false;
	percentDone = 0;
	start = true;
	over810 = 0;
	stop = false;
	end = false;
	loopitr = 0;
	id = 0;
	id2 = 0;
	bgx = 0;
	coefficientOfSpeed = 4;
	override = false;
	animParam[0][1] = 0; animParam[0][2] = 0; animParam[0][3] = 0;
	animParam[1][1] = 0; animParam[1][2] = 0; animParam[1][3] = 0;
	currentM = 0;
	player = new space(-40, 300, 1);
}

/*
------------------------------------------------------------------------------------------------------------
| The doAMove function moves all the blocks and events and draws them to the screen, as well as the player.|
------------------------------------------------------------------------------------------------------------
*/

function doAMove(){
	if (!(paused)){
		if (player.die && !end){
			delay(1000);
			resetGame();
			attempts ++;
			theplatform.push(new platform(-40, 399+30, 860, 150, 0, 0));
			theplatform.push(new platform(-40, 399-420, 860, 150, 0, 0));
			theplatform.push(new msg(240, 239, "Attempt " + attempts, "#00FF00"));
			console.log("restart..................");
		} else if (!end){
			if (!(player.die)){
				yHit = false;
				let over810 = 0;
				disp.fillStyle = globalColor[2];
				disp.fillRect(0, 0, 820, 640);
				if (!(staticCamera || start || end || endstatic)){
					bgx -= 0.5;
					if (bgx <  -819){
						bgx = 0;
					}
				}
				disp.globalAlpha = 0.4;
				disp.drawImage(document.getElementById("bg"),bgx, 129, 820, 300); 
				disp.drawImage(document.getElementById("bg"),bgx + 820, 129, 820, 300); 
				disp.globalAlpha = 1;
				if (genMap && !(staticCamera)){
					buildMap();
				}
				for (let i = 0; i < dots.length; i++){
					if (!staticCamera && !start && !end){
						dots[i].move(coefficientOfSpeed);
					}
					dots[i].drawSelf();
					if (dots[i].x < 0){
						dots.splice(i, 1);
					}
				}
				if (!(endstatic)){
					player.moveSelect();
				}
				player.draw();
				for (let i = 2; i < theplatform.length; i++){
					if (!(staticCamera) && !(start) && !end){
						theplatform[i].move(coefficientOfSpeed);
					}
					if (theplatform[i].anim != 0){
						theplatform[i].runAnim();
					}
					if (theplatform[i].x < player.x && theplatform[i].x >= player.x -coefficientOfSpeed && !yHit){
						percentDone ++;
						yHit = true;
						currentPercent = Math.round(percentDone/(percentage/100));
						//console.log(percentDone, currentPercent, percentage);
					}
					if (theplatform[i].spike > 0){
						theplatform[i].drawthis();
					}
					if (theplatform[i].x > 810){
						over810++;
					} else if (theplatform[i].x < -30){
						theplatform.splice(i, 1);
					} 
				}
				for (let i = 2; i < theplatform.length; i++){
					if (theplatform[i].spike == 0){
						theplatform[i].drawthis();
					} 
				}
				theplatform[0].drawthis();
				theplatform[1].drawthis();
				if (!(staticCamera || start || end || endstatic)){
					gx -= 4;
					if (gx <  -819){
						gx = 0;
					}
				}
				percent();
				if (!staticCamera && !start){
					for (let i = 0; i < eventQueue.length; i++){
						eventQueue[i].move(coefficientOfSpeed);
					}
					if (over810 == 0){
						genMap = true;
					}
				} else if (staticCamera){
					player.x += 4;
					if ((player.x > 720 && !(player.die))){
						start = false;
						staticCamera = false;
						window.clearInterval(stopid);
						reBuildMap();
						//console.log("yet");
						dots = []
						stopid = window.setInterval(doAMove, 15);
					}
				} 
				if (start || end){
					player.x +=coefficientOfSpeed;
					if (player.x > 236){
						start = false;
					}
				}
			}
		} else if (end){
			//console.log("ended");
			if (player.x >= 820){
				disp.globalAlpha = 0.3;
			}
			disp.fillStyle = globalColor[2];
			disp.fillRect(0, 0, 820, 640);
			disp.globalAlpha = 0.4;
			disp.drawImage(document.getElementById("bg"),bgx, 129, 820, 300); 
			disp.drawImage(document.getElementById("bg"),bgx + 820, 129, 820, 300);
			disp.globalAlpha = 1;
			if (player.x >= 820){
				disp.globalAlpha = 0.3;
			}
			for (let i = 0; i < dots.length; i++){
				dots[i].drawSelf();
			}
			player.moveSelect();
			player.x += coefficientOfSpeed;
			player.draw();
			for (let i = 2; i < theplatform.length; i++){
				if (theplatform[i].anim != 0){
					theplatform[i].runAnim();
				}
				theplatform[i].drawthis();
			}
			theplatform[0].drawthis();
			theplatform[1].drawthis();
			percent();
			if (player.x >= 820){
				disp.globalAlpha = 1.0;
				box();
				disp.font = "48px Arial";
				disp.fillStyle  = "#FFFFFF";
				disp.fillText("Level complete!!", 230, 100);
				disp.font = "24px Arial";
				disp.fillText("Attempts: " + attempts, 345, 160);
			}
		}
	} else if (paused){
		box();
		disp.font = "72px Arial";
		disp.fillStyle  = "#FFFFFF";
		disp.fillText("Paused", 290, 140);
	}
}