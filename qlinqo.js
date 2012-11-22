//http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
		  window.webkitRequestAnimationFrame || 
		  window.mozRequestAnimationFrame    || 
		  window.oRequestAnimationFrame      || 
		  window.msRequestAnimationFrame     || 
		  function( callback ){
			window.setTimeout(callback, 1000 / 60);
		  };
})();

//http://notes.jetienne.com/2011/05/18/cancelRequestAnimFrame-for-paul-irish-requestAnimFrame.html
window.cancelRequestAnimFrame = ( function() {
    return window.cancelAnimationFrame          ||
        window.webkitCancelRequestAnimationFrame    ||
        window.mozCancelRequestAnimationFrame       ||
        window.oCancelRequestAnimationFrame     ||
        window.msCancelRequestAnimationFrame        ||
        clearTimeout
} )();


var Qlinqo = {'foregroundLayer':null
			, 'playfieldLayer':null
			, 'statusLayer':null
			, 'gameOverLayer':null
			, 'world': null
			, 'gamePieces': []
			, 'pegs': []
			, 'width':480.0
			, 'height':640.0
			, 'scale': 40.0
			, 'radiusDisk': 0.3
			, 'colors': []
			, 'defaultFillColor': null
			, 'defaultStrokeColor': null
			, 'drawDebugData': false
			, 'addStats': false
			, 'pointTextObject': null
			, 'currentPlayerPoints': 0
			, 'ballsLeft': 5
			, 'ballsScored':0};

Qlinqo.Setup = function (playfieldLayer, foregroundLayer, backgroundLayer, debugLayer, statusLayer, gameOverLayer) {

	//setup sound effects
	
	Qlinqo.SfxInterface = new SfxInterface(['Resources/beep1.wav'
										   ,'Resources/beep2.wav'
										   ,'Resources/beep3.wav'
										   ,'Resources/beep4.wav'
										   ,'Resources/points.wav'
										   ,'Resources/zeropoints.wav'
										   ,'Resources/highpoints.wav']);
	Qlinqo.SfxInterface.setVolume(0.5);
	Qlinqo.SfxInterface.setVolumeAt(0, 0.1);
	Qlinqo.SfxInterface.setVolumeAt(1, 0.1);
	Qlinqo.SfxInterface.setVolumeAt(2, 0.1);
	Qlinqo.SfxInterface.setVolumeAt(3, 0.2);

	Qlinqo.colors.push(new Qlinqo.Util.ColorRGBA(255, 255, 255, 255));//white #ffffff
	Qlinqo.colors.push(new Qlinqo.Util.ColorRGBA(255, 255, 0, 255));//yellow #ffff00
	Qlinqo.colors.push(new Qlinqo.Util.ColorRGBA(255, 165, 0, 255));//orange #ffa500
	Qlinqo.colors.push(new Qlinqo.Util.ColorRGBA(0, 0, 255, 255));//blue #0000ff
	Qlinqo.colors.push(new Qlinqo.Util.ColorRGBA(0, 128, 0, 255));//green #008000
	Qlinqo.colors.push(new Qlinqo.Util.ColorRGBA(255, 0, 0, 255));//red #ff0000
	Qlinqo.colors.push(new Qlinqo.Util.ColorRGBA(128, 0, 128, 255));//purple #800080
	
	Qlinqo.defaultFillColor = new Qlinqo.Util.ColorRGBA(153, 102, 51, 255);//(0,128,0,255);
	Qlinqo.defaultStrokeColor = new Qlinqo.Util.ColorRGBA(102, 51, 17, 255);//(0,102,34,255);

	var groundHeight = 0.1;
	var scaledWidth = Qlinqo.width/Qlinqo.scale;
	var scaledHeight = Qlinqo.height/Qlinqo.scale;
	var groundTop = scaledHeight - groundHeight;

	var   b2Vec2 = Box2D.Common.Math.b2Vec2
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
	;
	
	Qlinqo.world = new b2World(
	   new b2Vec2(0, 20)    //gravity
	,  true                 //allow sleep
	);
	
	Qlinqo.playfieldLayer = playfieldLayer;
	Qlinqo.foregroundLayer = foregroundLayer;
	Qlinqo.statusLayer = statusLayer;
	Qlinqo.gameOverLayer = gameOverLayer;
	
	//Setup our Current Points drawn object
	Qlinqo.pointTextObject = new Qlinqo.NeonText(scaledWidth - 0.2, -0.7, 0, 30, "right", "#782970");
	backgroundLayer.addChild(Qlinqo.pointTextObject);
	
	var contactListener = new Box2D.Dynamics.b2ContactListener();           
    contactListener.BeginContact = function(contact) {
		var drawnFixedObject = null;
		var gamePieceDrawnObject = null;
		var bodyAData = contact.m_nodeA.other.GetUserData();
		var bodyBData = contact.m_nodeB.other.GetUserData();
        if(bodyAData) {
			if(bodyAData instanceof Qlinqo.GamePiece)
				gamePieceDrawnObject = bodyAData;
			else
				drawnFixedObject = bodyAData;
		} 
		if (bodyBData) {
			if(bodyBData instanceof Qlinqo.GamePiece)
				gamePieceDrawnObject = bodyBData;
			else
				drawnFixedObject = bodyBData;
		}
		if(drawnFixedObject) {
			if(drawnFixedObject instanceof Qlinqo.Peg) {
				//drawnFixedObject.highlight(true, Qlinqo.colors[Qlinqo.Util.NextRandom(0, Qlinqo.colors.length)]);
				
				//play high sound
				Qlinqo.SfxInterface.playFileAt(Qlinqo.Util.NextRandom(0, 3));
			}
			else {
				//play low sound
				Qlinqo.SfxInterface.playFileAt(3);
			}
		} 
		else if(typeof contact.m_nodeA.other.pointValue != "undefined" || typeof contact.m_nodeB.other.pointValue != "undefined") {
			if(!gamePieceDrawnObject.scored)
			{
				gamePieceDrawnObject.scored = true;
				var pointPlate = null;
				if(typeof contact.m_nodeA.other.pointValue != "undefined")
					pointPlate = contact.m_nodeA.other;
				else
					pointPlate = contact.m_nodeB.other;
				var points = pointPlate.pointValue;
				Qlinqo.currentPlayerPoints += points;
				
				if(!points) {
					Qlinqo.SfxInterface.playFileAt(5);
				} else {
					if(points >= 5000)
						Qlinqo.SfxInterface.playFileAt(6);
					else
						Qlinqo.SfxInterface.playFileAt(4);
				}
				var worldCenter = pointPlate.GetWorldCenter();
				
				Qlinqo.statusLayer.addChild(new Qlinqo.AnimatedFadeOutText(worldCenter.x, worldCenter.y - 0.2, points));
				
				Qlinqo.pointTextObject.text = Qlinqo.currentPlayerPoints;
				Qlinqo.pointTextObject.layer.needsDisplay = true;
				
			}
		}
		else {
			//console.log('something just hit something else');
		}
		
    };

	Qlinqo.world.SetContactListener(contactListener);
	
	var fixDef = new b2FixtureDef;
	fixDef.density = 1.0;
	fixDef.friction = 0.5;
	fixDef.restitution = 0.2;

	var bodyDef = new b2BodyDef;

	//create ground drawn object, we'll create box2d fixtures and body later for point hit detection
	playfieldLayer.addChild(new Qlinqo.Rect(0, scaledHeight - groundHeight, scaledWidth, groundHeight, Qlinqo.defaultFillColor,  Qlinqo.defaultStrokeColor));
	
	//create sides
	bodyDef.position.x = 0.05;
	bodyDef.position.y = scaledHeight/2;
	fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
	fixDef.shape.SetAsBox(0.05, scaledHeight/2);
	Qlinqo.world.CreateBody(bodyDef).CreateFixture(fixDef);
	playfieldLayer.addChild(new Qlinqo.Rect(0, 0, 0.1, scaledHeight, Qlinqo.defaultFillColor,  Qlinqo.defaultStrokeColor));
	
	bodyDef.position.x = (scaledWidth) - 0.05;
	fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
	fixDef.shape.SetAsBox(0.05, scaledHeight/2);
	Qlinqo.world.CreateBody(bodyDef).CreateFixture(fixDef);
	playfieldLayer.addChild(new Qlinqo.Rect(scaledWidth - 0.1, 0, 0.1, scaledHeight, Qlinqo.defaultFillColor,  Qlinqo.defaultStrokeColor));
	
	backgroundLayer.addChild(new Qlinqo.NeonText(scaledWidth/2, 0.4, "Qliq Here", 26, "center", "#008000", "#008000"));
	
	backgroundLayer.addChild(new Qlinqo.Rect(0.1, 0, scaledWidth - 0.2, 2, new Qlinqo.Util.ColorRGBA(221, 221, 221, 0), new Qlinqo.Util.ColorRGBA(128, 128, 128, 255)));
	//playfieldLayer.addChild(new Qlinqo.Rect(0.1, 0, scaledWidth - 0.2, 2, new Qlinqo.Util.ColorRGBA(0, 0, 0, 255), new Qlinqo.Util.ColorRGBA(0, 0, 0, 255)));
	backgroundLayer.addChild(new Qlinqo.NeonText(scaledWidth/2, scaledHeight/2, "Qlinqo", 60));
	
	//setup vars
	var pegRadius = 0.1;
	var pegCount = 10;
	var padding = 2;
	var scaledPadding = padding * Qlinqo.scale;
	var xDist = (Qlinqo.width/Qlinqo.scale - padding)/(pegCount - 1);//1.1;//(radiusDisk * 2.5);
	var yDist = xDist * Math.sqrt(3)/2.0;
	var rows = ((Qlinqo.height - scaledPadding)/Qlinqo.scale) / xDist;
	var cols = Math.floor(((Qlinqo.width - scaledPadding)/Qlinqo.scale) / yDist);
	
	var yBodyStart = 3;//where we start building the pegs and polygons
	
	//since box2d seems to not like concave polygon collision detection,
	// we'll create triangles for the sides
	//left side
	bodyDef.position.x = 0.1;
	for(var row=1; row <= rows; row+=2)
	{
		bodyDef.position.y = yBodyStart + ((row - 1) * yDist);
		var vertices = new Array();
		vertices.push(new b2Vec2(0, 0));
		vertices.push(new b2Vec2(xDist/2, yDist));
		vertices.push(new b2Vec2(0, (2 * yDist)));
		fixDef.shape.SetAsArray(vertices, 0);
		var body = Qlinqo.world.CreateBody(bodyDef);
		var poly = new Qlinqo.Polygon(bodyDef.position.x, bodyDef.position.y, vertices);
		body.SetUserData(poly);
		body.CreateFixture(fixDef);
		
		playfieldLayer.addChild(poly);
	}
	//right side
	bodyDef.position.x = (scaledWidth) - 0.1;
	for(var row=1; row <= rows; row+=2)
	{
		bodyDef.position.y = yBodyStart + ((row - 1) * yDist);
		var vertices = new Array();
		vertices.push(new b2Vec2(0, 0));
		vertices.push(new b2Vec2(0, (2 * yDist)));
		vertices.push(new b2Vec2(-xDist/2, yDist));
		fixDef.shape.SetAsArray(vertices, 0);
		var body = Qlinqo.world.CreateBody(bodyDef);
		var poly = new Qlinqo.Polygon(bodyDef.position.x, bodyDef.position.y, vertices);
		body.SetUserData(poly);
		body.CreateFixture(fixDef);
		
		playfieldLayer.addChild(poly);
	}
	
	
	//create the clinko knobs
	fixDef.density = 2.0;
	fixDef.friction = 0.01;
	fixDef.restitution = 0.4;
	fixDef.shape = new b2CircleShape(pegRadius);

	for(var row = 0; row <= rows; row++)
	{
		for(var col = 0; col < cols; col++)
		{
			var offset = 0;
			if(row % 2 == 1)
			{
				if(col == cols - 1)
					break;
				offset = xDist/2.0;
			}
			bodyDef.position.x = 1 + (col * xDist) + offset;
			bodyDef.position.y = yBodyStart + (row * yDist);
			
			var peg = new Qlinqo.Peg(bodyDef.position.x
							 , bodyDef.position.y
							 , 0.2
							 , 0.2);
			playfieldLayer.addChild(peg);
			
			Qlinqo.pegs.push(peg);
		 
			var body = Qlinqo.world.CreateBody(bodyDef);
			//set a property of the body to retrieve later on collision
			body.SetUserData(peg);
			body.CreateFixture(fixDef);
		}
	}

	//create slots
	var slotY = groundTop - 0.45;
	for(var col = 0; col < cols; col++) {
		fixDef.shape = new b2PolygonShape;
		fixDef.shape.SetAsBox( 0.1, 0.45 );
		bodyDef.position.y = slotY;
		bodyDef.position.x = 1 + (col * xDist);
		 
		var body = Qlinqo.world.CreateBody(bodyDef);
		var slot = new Qlinqo.Rect(bodyDef.position.x - 0.1, groundTop - 0.9, 0.2, 0.9, Qlinqo.defaultFillColor,  Qlinqo.defaultStrokeColor);
		body.SetUserData(slot);
		body.CreateFixture(fixDef);
		
		playfieldLayer.addChild(slot);
		
	}
	
	//create the bottom slot/point collision detectors
	fixDef.density = 1.0;
	fixDef.friction = 5.0;
	fixDef.restitution = 0.2;
	
	var pointValues = [5000, 100, 500, 1000, 0, 10000, 0, 1000, 500, 100, 5000];
	for(var col = 0; col < cols + 1; col++) {
		fixDef.shape = new b2PolygonShape;
		fixDef.shape.SetAsBox( xDist/2, 0.05 );
		bodyDef.position.y = scaledHeight - groundHeight/2;
		bodyDef.position.x = 0.45 + (col * xDist);
		var body = Qlinqo.world.CreateBody(bodyDef)
		body.pointValue = pointValues[col];
		body.CreateFixture(fixDef);
		
		//add the text for the slot point value
		backgroundLayer.addChild(new Qlinqo.PointValueText(0.45 + (col * xDist), groundTop - 0.2, pointValues[col])); 
	}

	//setup debug draw
	if(Qlinqo.drawDebugData)
	{
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(debugLayer.ctx);
		debugDraw.SetDrawScale(Qlinqo.scale);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		Qlinqo.world.SetDebugDraw(debugDraw);
	}
	
	Qlinqo.startOver();
	
	//window.setInterval(Qlinqo.update, 1000 / 60);
	document.requestAnimFrameId = requestAnimFrame(Qlinqo.update);
	
	window.setInterval(Qlinqo.fadePegs, 100);
};

Qlinqo.newGamePiece = function(x, y) {

	if(Qlinqo.ballsLeft > 0)
	{
		var fixDef = new Box2D.Dynamics.b2FixtureDef;
		
		var bodyDef = new Box2D.Dynamics.b2BodyDef;
		
		fixDef.friction = 0.01;
		fixDef.density = 1.7;
		fixDef.restitution = 0.4;

		//create the box2d object
		bodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;

		fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(Qlinqo.radiusDisk);
		//make a bit of noise to make things interesting
		x += Qlinqo.Util.NextRandom(-3, 4);
		y += Qlinqo.Util.NextRandom(-3, 4);
		bodyDef.position.x = x/Qlinqo.scale;
		bodyDef.position.y = y/Qlinqo.scale;
		var diskBody = Qlinqo.world.CreateBody(bodyDef);
		var gamePiece = new Qlinqo.GamePiece(diskBody, Qlinqo.radiusDisk * 2, Qlinqo.radiusDisk * 2);
		gamePiece.body = diskBody;//setup backreference so we can remove the body when the game piece is removed
		Qlinqo.gamePieces.push(gamePiece);
		diskBody.SetUserData(gamePiece);
		
		Qlinqo.foregroundLayer.addChild(gamePiece);
		
		diskBody.CreateFixture(fixDef);

		Qlinqo.ballsLeft--;
		//remove one of our drawn objects
		for(var i in Qlinqo.statusLayer.children)
		{
			if(Qlinqo.statusLayer.children[i] instanceof Qlinqo.StatusGamePiece)
			{
				Qlinqo.statusLayer.removeChild(Qlinqo.statusLayer.children[i]);
				break;
			}
		}
	}
};

Qlinqo.fadePegs = function() {
	for(var i in Qlinqo.pegs)
	{
		Qlinqo.pegs[i].fade();
	}
};

Qlinqo.startOver = function() {
	Qlinqo.currentPlayerPoints = 0;
	Qlinqo.ballsLeft = 5;
	Qlinqo.ballsScored = 0;
	Qlinqo.pointTextObject.layer.needsDisplay = true;
	Qlinqo.statusLayer.needsDisplay = true;
	
	Qlinqo.pointTextObject.text = 0;
	//setup our status object for current points and balls left
	for(var i = Qlinqo.ballsLeft - 1; i >= 0; i--)
	{
		Qlinqo.statusLayer.addChild(new Qlinqo.StatusGamePiece(12 + i * 12, 12));
	}
};

Qlinqo.update = function() {

	document.requestAnimFrameId = requestAnimFrame(Qlinqo.update);

	//look for sleeping gamePieces to remove
	for(var i = Qlinqo.gamePieces.length - 1; i >= 0; i--)
	{
		var gamePiece = Qlinqo.gamePieces[i];
		if(!gamePiece.body.IsAwake() && gamePiece.scored)
		{
			Qlinqo.world.DestroyBody(gamePiece.body);
			Qlinqo.gamePieces.splice(i, 1);
			gamePiece.layer.removeChild(gamePiece);
			
			Qlinqo.ballsScored++;
			//check for end of game
			if(Qlinqo.ballsScored == 5) {
				//start fireworks if we had enough points
				var pointMsg = "Try Again!";
				var fwLength = Qlinqo.currentPlayerPoints / 5000;
				var fwLevel = 0;
				if(Qlinqo.currentPlayerPoints == 50000) {
					pointMsg = "Perfect Score!";
					fwLength = Qlinqo.currentPlayerPoints;
					fwLevel = 16;
				} else if(Qlinqo.currentPlayerPoints >= 40000) {
					pointMsg = "Amazing Score!";
					fwLevel = 8;
				} else if(Qlinqo.currentPlayerPoints >= 30000) {
					pointMsg = "Outstanding Score!";
					fwLevel = 4;
				} else if(Qlinqo.currentPlayerPoints >= 20000) {
					pointMsg = "Impressive Score!";
					fwLevel = 2;
				} else if(Qlinqo.currentPlayerPoints >= 10000) {
					pointMsg = "Good Score!";
				} else if(Qlinqo.currentPlayerPoints >= 5000) {
					pointMsg = "Good Effort!";
				} 
				
				if(fwLevel) {
					FW.StartRandomBlasts(fwLength, fwLevel);
				}
			
				Qlinqo.gameOverLayer.addChild(new Qlinqo.GameOverScreen(pointMsg));
			}
		}
	}

	for(var i in Qlinqo.foregroundLayer.children)
	{
		Qlinqo.foregroundLayer.children[i].update();
	}

	Qlinqo.world.Step(
	   1 / 60   //frame-rate
	,  10       //velocity iterations
	,  10       //position iterations
	);
	if(Qlinqo.drawDebugData)
		Qlinqo.world.DrawDebugData();
	Qlinqo.world.ClearForces();
	
	document.StratiscapeDraw.draw();
	
	if(document.stats)
	{
		document.stats.update();
	}
	
	
	
	//draw grid lines
	/*
	var ctx = document.StratiscapeDraw.getLayer('canvasQlinqoBackground').ctx;
	ctx.strokeStyle = '#EEE';
	for(var row = 0; row < Qlinqo.width/Qlinqo.scale; row++)
	{
		ctx.beginPath();
		ctx.moveTo(row*Qlinqo.scale, 0);
		ctx.lineTo(row*Qlinqo.scale, Qlinqo.height);
		ctx.closePath();
		ctx.stroke();
	}
	for(var col = 0; col < Qlinqo.height/Qlinqo.scale; col++)
	{
		ctx.beginPath();
		ctx.moveTo(0, col*Qlinqo.scale);
		ctx.lineTo(Qlinqo.width, col*Qlinqo.scale);
		ctx.closePath();
		ctx.stroke();
	}
	*/
	
};

Qlinqo.GamePiece = Stratiscape.DrawnObject.extend({ //gamepiece/disk drawn object class

	init: function(body, width, height) {
		this.body = body;
		this.width = width * Qlinqo.scale;
		this.height = height * Qlinqo.scale;
		this.wRadius = this.width/2;
		this.hRadius = this.height/2;
		
		this.imageLoaded = false;
		var my = this;
		this.image = new Image();
		this.image.onload = function() {
				my.imageLoaded = true;
			};
		this.image.src = 'Resources/ball.png';
		
		//set a slight random rotation to make things interesting
		var omega = Qlinqo.Util.NextRandom(-15, 16);
		this.body.SetAngularVelocity(omega);
	},
	
	update: function() {
		this.rotation = this.body.GetAngle();
		this.x = this.body.GetWorldCenter().x * Qlinqo.scale;
		this.y = this.body.GetWorldCenter().y * Qlinqo.scale;
		this.layer.needsDisplay = true;
	},
	
	draw: function(ctx) {
	
		if(this.imageLoaded) {
			ctx.save();
			ctx.translate( this.x, this.y);
			ctx.rotate(this.rotation);
			ctx.translate( -this.width/2 , -this.height/2 );
			ctx.drawImage( this.image, 0, 0);
			ctx.restore();
		} else {
			var my = this;
			setTimeout(function() {my.draw(ctx);}, 20);
		}
	
		//ctx.drawImage(this.image, this.x - this.wRadius, this.y - this.hRadius);
	}
	
});

Qlinqo.StatusGamePiece = Stratiscape.DrawnObject.extend({ //shows how many balls are left

	init: function(x, y) {
		this.x = x;
		this.y = y;
		this.width = 12;
		this.height = 12;
		this.wRadius = this.width/2;
		this.hRadius = this.height/2;
		
		this.imageLoaded = false;
		var my = this;
		this.image = new Image();
		this.image.onload = function() {
				my.imageLoaded = true;
			};
		this.image.src = 'Resources/ball-small.png';
	},
	
	draw: function(ctx) {
		if(this.imageLoaded) {
			ctx.drawImage(this.image, this.x - this.wRadius, this.y - this.hRadius);
		} else {
			var my = this;
			setTimeout(function() {my.draw(ctx);}, 20);
		}
	}
	
});

Qlinqo.Peg = Stratiscape.DrawnObject.extend({ //peg/knob drawn object class

	init: function(x, y, width, height) {
		this.x = x * Qlinqo.scale;
		this.y = y * Qlinqo.scale;
		this.width = width * Qlinqo.scale;
		this.height = height * Qlinqo.scale;
		this.highlighted = false;
		this.color = Qlinqo.defaultFillColor;
	},
	
	fade: function() {
		if(!this.color.equals(Qlinqo.defaultFillColor))	{
			this.color.fadeTo(Qlinqo.defaultFillColor);
			this.layer.needsDisplay = true;
		}
	},
	
	highlight: function(highlighted, color) {
		this.highlighted = highlighted;
		this.color = color;
		this.layer.needsDisplay = true;
	},
	
	draw: function(ctx) {
	
		ctx.strokeStyle = this.color.multiply(0.5).toString();
		ctx.fillStyle = this.color.toString();
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(this.x,this.y,this.width/2,0,Math.PI*2,true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}
	
});

Qlinqo.Rect = Stratiscape.DrawnObject.extend({ //rectangle drawn object class

	init: function(x, y, width, height, fillColor, strokeColor) {
		this.x = x * Qlinqo.scale;
		this.y = y * Qlinqo.scale;
		this.width = width * Qlinqo.scale;
		this.height = height * Qlinqo.scale;
		this.fillColor = fillColor;
		this.strokeColor = strokeColor;
	},
	
	draw: function(ctx) {
	
		ctx.fillStyle = this.fillColor.toString();
		ctx.strokeStyle = this.strokeColor.toString();
		ctx.fillRect(this.x,this.y,this.width,this.height);  
		ctx.strokeRect(this.x,this.y,this.width,this.height);  
	}
});

Qlinqo.Polygon = Stratiscape.DrawnObject.extend({ //polygon drawn object class

	init: function(x, y, points) {
		this.points = new Array();
		for(var i = 0; i < points.length; i++)
		{
			this.points.push({'x': (points[i].x + x) * Qlinqo.scale , 'y': (points[i].y + y) * Qlinqo.scale});
		}
	},
	
	draw: function(ctx) {
	
		ctx.fillStyle = Qlinqo.defaultFillColor.toString();
		ctx.strokeStyle = Qlinqo.defaultStrokeColor.toString();
		
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		for(var i = 1; i < this.points.length; i++)
		{
			var p = this.points[i];
			ctx.lineTo(p.x, p.y);
		}
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

	}
	
});

Qlinqo.DrawnText = Stratiscape.DrawnObject.extend({ //DrawnText drawn object class

	init: function(x, y, text, size) {
		this.x = x * Qlinqo.scale;
		this.y = y * Qlinqo.scale;
		this.text = text.toString();
		this.size = size;
	},
	
	draw: function(ctx) {
	
		ctx.fillStyle = '#FFF';
		ctx.strokeStyle = '#EEE'
		ctx.font = "bolder " + this.size + "pt Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText(this.text, this.x, this.y);
	}
	
});

Qlinqo.PointValueText = Stratiscape.DrawnObject.extend({ //PointValueText drawn object class

	init: function(x, y, text) {
		this.x = x * Qlinqo.scale;
		this.y = y * Qlinqo.scale;
		this.text = text.toString();
	},
	
	draw: function(ctx) {
	
		ctx.fillStyle = '#FFF';
		ctx.strokeStyle = '#EEE'
		ctx.font = "bolder 20px Trebuchet MS,Tahoma,Verdana,Arial,sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		var textHeight = 16;
		for(var i = this.text.length-1; i >= 0; i--)
			ctx.fillText(this.text.charAt(i), this.x, this.y - (textHeight * (this.text.length-1-i)));

	}
	
});

Qlinqo.AnimatedFadeOutText = Stratiscape.DrawnObject.extend({ //Fade out text grows larger then dissapears when user gets a point drawn object class

	init: function(x, y, text) {
		this.x = x * Qlinqo.scale;
		this.y = y * Qlinqo.scale;
		this.text = text.toString();
		this.size = 20;
	},
	
	update: function() {
		this.y -= 1;
		this.size += 1;
		if(this.layer)
		{
			if(this.size >= 40)
				this.layer.removeChild(this);
			else
				this.layer.needsDisplay = true;
		}
	},
	
	draw: function(ctx) {
	
		ctx.fillStyle = '#FF0';
		ctx.strokeStyle = '#EEE'
		ctx.font = "bolder " + this.size + "px Trebuchet MS,Tahoma,Verdana,Arial,sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		var textHeight = this.size - 4;
		for(var i = this.text.length-1; i >= 0; i--)
			ctx.fillText(this.text.charAt(i), this.x, this.y - (textHeight * (this.text.length-1-i)));
		
		var me = this;
		setTimeout(function() {me.update();}, 50);
	}
	
});

Qlinqo.NeonText = Stratiscape.DrawnObject.extend({ //Text with a Neon glow drawn object class

	init: function(x, y, text, size, align, textHexColor, blurHexColor) {
		this.x = x * Qlinqo.scale;
		this.y = y * Qlinqo.scale;
		this.text = text.toString();
		this.size = size;
		if(textHexColor !== null && typeof textHexColor == 'undefined')
			textHexColor = "#FFF";
		if(blurHexColor !== null && typeof blurHexColor == 'undefined')
			blurHexColor = "#ff00de";
		//http://www.html5rocks.com/en/tutorials/canvas/texteffects/#toc-text-shadow-clipping
		this.shadow = "0 0 10px "+textHexColor+", 0 0 20px "+textHexColor+", 0 0 30px "+textHexColor+", 0 0 40px , 0 0 70px "+blurHexColor+", 0 0 80px "+blurHexColor+", 0 0 100px "+blurHexColor+", 0 0 150px "+blurHexColor;
		this.background = "#000";
		this.color = textHexColor;
		this.align = "center";
		if(align !== null && typeof align != "undefined")
		{
			this.align = align;
		}
	},
	
	draw: function(ctx) {
	
		var text = this.text;
		
		ctx.font = "bolder " + this.size + "px 'Lucida Sans Unicode', 'Lucida Grande', sans-serif";
		ctx.textAlign = "left";
		ctx.textBaseline = 'middle';
		var textHeight = this.size * 3.5;
		var textTop = textHeight/2;
		
		var width = ctx.measureText(text).width;
		var xOffset = -width/2;
		if(this.align == "left")
			xOffset = 0;
		else if(this.align == "right")
			xOffset = -width;
		// add a background to the current effect
		ctx.fillStyle = this.background;
		ctx.fillRect(this.x + xOffset, this.y, width, textHeight - 1)
		// parse text-shadows from css
		var shadows = Qlinqo.Util.parseShadow(this.shadow);
		// loop through the shadow collection
		var n = shadows.length; while(n--) {
			var shadow = shadows[n];
			var totalWidth = width + shadow.blur * 2;
			ctx.save();
			ctx.beginPath();
			ctx.rect(this.x + xOffset - shadow.blur, this.y, this.x + xOffset + totalWidth, textHeight);
			ctx.clip();
			if (shadow.blur) { // just run shadow (clip text)
				ctx.shadowColor = shadow.color;
				ctx.shadowOffsetX = shadow.x + totalWidth;
				ctx.shadowOffsetY = shadow.y;
				ctx.shadowBlur = shadow.blur;
				ctx.fillText(text, -totalWidth + this.x + xOffset, this.y + textTop);
			} else { // just run pseudo-shadow
				ctx.fillStyle = shadow.color;
				ctx.fillText(text, this.x + xOffset + (shadow.x||0), this.y - (shadow.y||0) + textTop);
			}
			ctx.restore();
		}
		// drawing the text in the foreground
		if (this.color) {
			ctx.fillStyle = this.color;
			ctx.fillText(text, this.x + xOffset, this.y + textTop);
		}
		
	}
	
});

Qlinqo.GameOverScreen = Stratiscape.DrawnObject.extend({
	init: function(gameOverText) {
		this.x = 0;
		this.y = 0;
		this.width = 120;
		this.height = 160;
		this.gameOverText = gameOverText;
	},
	
	fadeAway: function() {
		var wDiff = 12;
		var hDiff = 16;
		this.width -= wDiff;
		this.height -= hDiff;
		this.x += wDiff/2;
		this.y += hDiff/2;
		
		if(this.layer) {
			if(this.width <= 0) {
				this.layer.removeChild(this);
			} else {
				this.layer.needsDisplay = true;
				var me = this;
				setTimeout(function(){me.fadeAway();},100);
			}
		}
	},
	
	draw: function(ctx) {
		if(this.width == 120) {
			ctx.lineWidth = 8;
		} else if(this.width >= 60) {
			ctx.lineWidth = 4;
		} else {
			ctx.lineWidth = 2;
		}
		ctx.fillStyle = Qlinqo.defaultFillColor.toString();
		ctx.strokeStyle = Qlinqo.defaultStrokeColor.toString();
		ctx.fillRect(this.x,this.y,this.width,this.height);  
		ctx.strokeRect(this.x,this.y,this.width,this.height); 
		
		ctx.font = "bolder 30px 'Lucida Sans Unicode', 'Lucida Grande', sans-serif";
		var textHeight = 20;
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillStyle = "#000";
		ctx.fillText("Game", this.x + this.width/2, this.y + textHeight * 2);
		ctx.fillText("Over", this.x + this.width/2, this.y + textHeight * 4);
		
		var gameOverTexts = this.gameOverText.split(" ", 2);
		ctx.fillStyle = "#FF0";
		ctx.font = "bolder 16px 'Lucida Sans Unicode', 'Lucida Grande', sans-serif";
		ctx.fillText(gameOverTexts[0], this.x + this.width/2, this.y + this.height - 56);
		ctx.fillText(gameOverTexts[1], this.x + this.width/2, this.y + this.height - 42);
		ctx.fillStyle = "#000";
		ctx.font = "bolder 10px 'Lucida Sans Unicode', 'Lucida Grande', sans-serif";
		ctx.fillText("Click here", this.x + this.width/2, this.y + this.height - 24);
		ctx.fillText("to play again", this.x + this.width/2, this.y + this.height - 12);		
	}
});

Qlinqo.Util = {};

/**
 * A ColorRGBA represents the red green blue and alpha of a color
 * @constructor
 */
Qlinqo.Util.ColorRGBA = function(r, g, b, a) {
	this.r = r;//red
	this.g = g;//green
	this.b = b;//blue
	this.a = a;//alpha
};

/**
 * multiply returns a new colorRGBA with the r, g, b values multiplied by the multiplyier
 * @this {Qlinqo.Util.ColorRGBA}
 * @return {Qlinqo.Util.ColorRGBA}
 */
Qlinqo.Util.ColorRGBA.prototype.multiply = function(multiplyier) {
	return new Qlinqo.Util.ColorRGBA(Math.floor(this.r * multiplyier)
								, Math.floor(this.g * multiplyier)
								, Math.floor(this.b * multiplyier)
								, this.a);
};

/**
 * fadeTo returns a new colorRGBA that is a bit closer to the r, g, b values of the ColorRGBA passed in
 * @this {Qlinqo.Util.ColorRGBA}
 * @return {Qlinqo.Util.ColorRGBA}
 */
Qlinqo.Util.ColorRGBA.prototype.fadeTo = function(colorToApproach) {
	
	//if they are the same, just return this
	if(this.equals(colorToApproach))
		return this;

	
	return new Qlinqo.Util.ColorRGBA(this.r > colorToApproach.r ? this.r - 1 : this.r + 1
								, this.g > colorToApproach.g ? this.g - 1 : this.g + 1
								, this.b > colorToApproach.b ? this.b - 1 : this.b + 1
								, this.a > colorToApproach.a ? this.a - 1 : this.a + 1);
};

/**
 * equals returns true if r, g, b, and a of the passed in ColorRGBA equals this ColorRGBA
 * @this {Qlinqo.Util.ColorRGBA}
 * @return {bool}
 */
Qlinqo.Util.ColorRGBA.prototype.equals = function(colorCompare) {
	return (this.r == colorCompare.r && this.g == colorCompare.g && this.b == colorCompare.b && this.a == colorCompare.a);
};

/**
 * toString converts a ColorRGBA object to a string the canvas can recognize
 * @this {Qlinqo.Util.ColorRGBA}
 * @return {string}
 */
Qlinqo.Util.ColorRGBA.prototype.toString = function() {
	return 'rgba(' + this.r + ', ' + this.g + ', ' + this.b + ', ' + this.a + ')';
};

Qlinqo.Util.NextRandom = function(lowInclusive, highExclusive) {

	if(highExclusive === null || typeof highExclusive == "undefined")
	{
		highExclusive = lowInclusive;
		lowInclusive = 0;
	}
	
	if(lowInclusive < 0)
		highExclusive += Math.abs(lowInclusive);
	else
		highExclusive -= lowInclusive;

	return Math.floor(Math.random()*highExclusive) + lowInclusive;
};

//http://www.html5rocks.com/en/tutorials/canvas/texteffects/#toc-text-shadow-clipping
Qlinqo.Util.parseShadow = function(shadows, em) {
		shadows = shadows.split(", ");
		var ret = [];
		for (var n = 0, length = shadows.length; n < length; n ++) {
			var shadow = shadows[n].split(" ");
			var type = shadow[0].replace(parseFloat(shadow[0]), "");
			if (type == "em") {
				var obj = {
					x: em * parseFloat(shadow[0]),
					y: em * parseFloat(shadow[1])
				};
			} else {
				var obj = {
					x: parseFloat(shadow[0]),
					y: parseFloat(shadow[1])
				};
			}
			if (shadow[3]) {
				obj.blur = parseFloat(shadow[2]);
				obj.color = shadow[3];
			} else {
				obj.blur = 0;
				obj.color = shadow[2];		
			}
			ret.push(obj);
		}
		return ret;
	};
