/**
 * Leaper Library.
 *
 * @param param				Description.
 */
function LeaperLib()
{
	// Hash with all installed gestures { codename : object }.
	this.gestures = {};
	
	// List of all listeners { event_name : [[mapping, listener], ...] }
	this.listeners = {};
	
	// List of all one-time-use listeners.
	this.once_listeners = {};
	
	// Set to false to temporarily stop tracking all gestures.
	this.track_gestures = true;
	
	// Setting: How long to wait after successful trigger.
	this.Trigger_Cooldown = 100;
};

LeaperLib.prototype.start = function()
{
	var firstValidFrame = null;
	
	Leap.loop({enableGestures: true}, (function(frame)
	{
		if(frame.valid)
		{
			// Use the first frame to serve as comparison
			if (!firstValidFrame) firstValidFrame = frame;
			
			// Do only track gestures if not in cooldown.
			if(this.track_gestures)
			{
				// Perform the loop on every Gesture.
				this.gesturesLoop(frame);
			}
			
			// [DEBUG] Used for debugging.
			this.trigger('loop', frame);
		}
		else
		{
			firstValidFrame = null;
		};
	}).bind(this));  
};

LeaperLib.prototype.appendGesture = function(name, object)
{
	// Stores the item in the gestures manifesto.
	this.gestures[name] = object;
	
	// Performs installation.
	object.install({
		triggerCallback : this.gestureTrigger.bind(this)
	});
};

LeaperLib.prototype.gesturesLoop = function(frame)
{
	for(var i in this.gestures)
	{
		this.gestures[i].loop(frame);
	};
};

/**
 * [INTERNAL] Re-allows tracking of gestures.
 */
LeaperLib.prototype.resumeTracking = function()
{
	this.track_gestures = true;
};

/**
 * [INTERNAL] Called by a gesture when triggering an event.
 */
LeaperLib.prototype.gestureTrigger = function(obj, params)
{
	// Trigger this gesture's event.
	this.trigger(params.name, params)
	
	// Trigger the generic "gesture" event.
	this.trigger('gesture', params);
	
	// Stop tracking for a moment.
	this.track_gestures = false;
	setTimeout(this.resumeTracking.bind(this), this.Trigger_Cooldown);
	
	// Clear all gestures buffer.
	for(var i in this.gestures)
	{
		this.gestures[i].clearBuffer();
	};
};






/*** Leaper Events ***/

/**
 * Listen to an event.
 *
 * @param type				Name of the event. Allows mapping: 'swipe.myCustomId'.
 * @param listener			Callback function.
 */
LeaperLib.prototype.on = function(type, listener)
{
	var type_mapping = this.events_fetchMapping(type);
	
	if (typeof this.listeners[type_mapping.type] == "undefined")
	{
		this.listeners[type_mapping.type] = [];
	}

	this.listeners[type_mapping.type].push([type_mapping.mapping, listener]);
	
	// Allow chaining.
	return this;
}

/**
 * Listen to an event, removing the listener once the event is triggered.
 *
 * @param type				Name of the event. Allows mapping: 'swipe.myCustomId'.
 * @param listener			Callback function.
 */
LeaperLib.prototype.once = function(type, listener)
{
	var type_mapping = this.events_fetchMapping(type);
	
	if (typeof this.once_listeners[type_mapping.type] == "undefined")
	{
		this.once_listeners[type_mapping.type] = [];
	}

	this.once_listeners[type_mapping.type].push([type_mapping.mapping, listener]);
	
	// Allow chaining.
	return this;
}

/**
 * [INTERNAL] Parses the event name mapping.
 *
 * @param type				Name of the event. Allows mapping: 'swipe.myCustomId'.
 */
LeaperLib.prototype.events_fetchMapping = function(type)
{
	var mapping = null;
	
	// Fetch mapping if any.
	if(type.indexOf('.') > 0)
	{
		var split_type = type.split('.');
		
		type = split_type[0];
		mapping = split_type[1];
	};
	
	return { type : type, mapping : mapping };
};

LeaperLib.prototype.events_buildEvent = function(event)
{
	if(typeof event == "string") { event = { type: event };	}
	if(!event.target) { event.target = this; }

	if (!event.type){  //falsy
		throw new Error("Event object missing 'type' property.");
	}
	
	event.parent = this.owner;
	
	return event;
}

/**
 * Triggers an event.
 *
 * @param event				Name of the event.
 * @param params			Parameters to pass listeners.
 */
LeaperLib.prototype.trigger = function(event, params)
{
	event = this.events_buildEvent(event);
	
	// Build the params for the callback.
	params = this.events_buildCallbackParams(event, params);
	
	if(this.listeners[event.type] instanceof Array)
	{
		var listeners = this.listeners[event.type];
		for(var i=0, len=listeners.length; i < len; i++)
		{
			if(listeners[i])
			{
				if(listeners[i][1])
					listeners[i][1].apply(null, params);
			}
		}
	}

	if(this.once_listeners[event.type] instanceof Array)
	{
		var listeners = this.once_listeners[event.type];
		for(var i=0, len=listeners.length; i < len; i++)
		{
			if(listeners[i])
			{
				if(listeners[i][1])
					listeners[i][1].apply(null, params);
			}
		}
		
		// Remove this event and it's listeners.
		delete this.once_listeners[event.type];
	}
	
	// Allow chaining.
	return this;
}

LeaperLib.prototype.events_buildCallbackParams = function(event, params)
{
	var built_params = params;
	
	// Turn non-array params into a single item array.
	if(!(built_params instanceof Array))
	{
		built_params = [built_params];
	}
	
	// Insert the event as the last param.
	built_params.push(event);
	
	return built_params;
};

/**
 * Removes listeners for an event, or a subset when using mapping.
 *
 * @param type				Name of the event. Allows mapping: 'swipe.myCustomId'.
 */
LeaperLib.prototype.off = function(type)
{
	var type_mapping = this.events_fetchMapping(type);
	
	if (this.listeners[type_mapping.type] instanceof Array)
	{
		var listeners = this.listeners[type_mapping.type];
		for (var i=0, len=listeners.length; i < len; i++)
		{
			if (listeners[i][0] === type_mapping.mapping && listeners[i][1] === listener)
			{
				listeners.splice(i, 1);
				break;
			}
		}
	}
	
	// Allow chaining.
	return this;
};

/*** Leaper Events End ***/








var Leaper = new LeaperLib();



/*** Gestures ***/

function LeaperGesture()
{
};

/**
 * Procedures when Leaper installs the gesture.
 */
LeaperGesture.prototype.install = function(params)
{
	this.triggerCallback = params.triggerCallback;
};

/**
 * Called within a Gesture to trigger an event.
 * 
 * @param params			{ name, ... }
 */
LeaperGesture.prototype.triggerGesture = function(params)
{
	if(this.triggerCallback)
	{
		this.triggerCallback(this, params);
	};
};

/**
 * Clears the gestures buffer.
 */
LeaperGesture.prototype.clearBuffer = function()
{
	this.gestures_buffer = [];
};

/**
 * Re-allows tracking of gestures.
 */
LeaperGesture.prototype.resumeTracking = function()
{
	this.track_gestures = true;
};

/**
 * Stops tracking until cooldown goes off.
 */
LeaperGesture.prototype.pauseTracking = function()
{
	// Clear buffer.
	this.gestures_buffer = [];
	
	// Stop tracking and resume after *certain time*.
	this.track_gestures = false;
	setTimeout(this.resumeTracking.bind(this), this.Trigger_Cooldown ? this.Trigger_Cooldown : 100);
};


/* Gestures toolbox */

LeaperGesture.prototype.capitaliseFirstLetter = function(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}



/*** Swipe Gesture ***/

function SwipeGesture()
{
	// Array tracking the last swipes in a given period of time.
	this.gestures_buffer = [];
	
	// Set to false to temporarily stop tracking gestures.
	this.track_gestures = true;
	
	// Setting: How long in miliseconds to track for motions.
	this.Tracking_Time_Length = 300;
	
	// Setting: How long to wait after successful trigger.
	this.Trigger_Cooldown = 1000;
	
	// Setting: Maximum gesture Z position to detect swipes with.
	this.Swipe_Gesture_Z_Threshold = 50;
	
	// Setting: Maximum gesture Z position to detect slides with.
	this.Slide_Gesture_Z_Threshold = 50;
	
	// Setting: Minimum (and optional) Z hand rotation to enforce it is a Swipe instead of Slide gesture.
	this.Swipe_Z_Hand_Rotation_Threshold = 0.5;
	
	// Setting: Minimum required difference ratio between top motion directions.
	// Ensures to trigger only motions that have clear motion directions.
	this.Clear_Direction_Speeds_Ratio_Threshold = 1.6;
	
	// Setting: Minimum required fingers to accept a swipe.
	this.Gesture_Finger_Count_Threshold = 1;
	
	// Setting: The higher, less horizontal translation on vertical motions
	// is required to consider such as a vertical motion.
	this.Horizontal_Vertical_Priority_ratio = 1.4;
	
	// Setting: Minimal translation length required to accept a swipe.
	this.Swipe_Length_Threshold = 70;
};
SwipeGesture.prototype = new LeaperGesture();
SwipeGesture.prototype.constructor = SwipeGesture;

SwipeGesture.prototype.loop = function(frame)
{
	
	/*
	if(frame.hands.length > 0)
	{
		var basis = frame.hands[0].rotation.xBasis;
		
		document.title = basis.x.toFixed(2) + ' · ' + basis.y.toFixed(2) + ' · ' + basis.z.toFixed(2)
	}
	else
	{
		document.title = '';
	};
	*/
	
	// Return if we are not allowed to track swipes again.
	if(!this.track_gestures) return;
	
	if(frame.gestures.length > 0)
	{
		for(var i in frame.gestures)
		{
			if(frame.gestures[i].type == 'swipe')
			{
				if(frame.gestures[i].state != 'end')
				{
					var valid_motion = false;
					
					// Check if motion meets requirements.
					if(frame.hands.length == 1 && frame.fingers.length >= this.Gesture_Finger_Count_Threshold)
					{
						if(frame.fingers.length <= 2)
						{
							valid_motion = frame.gestures[i].position.z < this.Slide_Gesture_Z_Threshold;
						}
						else
						{
							valid_motion = frame.gestures[i].position.z < this.Swipe_Gesture_Z_Threshold;
						};
					};
					
					// Only track valid motions.
					if(valid_motion)
					{
						var motion = this.getMotion(frame.gestures[i], frame);
						
						// Do only continue if it is a valid motion.
						if(motion !== false)
						{
							// Append speed and fingers to motion.
							motion.speed = frame.gestures[i].speed;
							motion.fingers = frame.fingers.length;
							
							// Append this swipe to the buffer.
							this.gestures_buffer.push(motion);
							
							// Once we have enough samples, attempt to capture a gesture.
							if(this.gestures_buffer.length >= 25)
							{
								this.processGestures();
							};
							
							if(this.clear_buffer_timeout) clearTimeout(this.clear_buffer_timeout);
							this.clear_buffer_timeout = setTimeout((function()
							{
								this.gestures_buffer = []; 
							}).bind(this), this.Tracking_Time_Length);
						}
					}
				}
				else
				{
					this.gestures_buffer = [];
				};
			};
		};
	};
};

/**
 * Averages and triggers buffered gestures.
 */
SwipeGesture.prototype.processGestures = function()
{
	if(!this.track_gestures) return;
	
	var can_trigger = true;
	
	
	
	/*** Reduce the length of buffer ***/
	
	// Return if there are no buffered swipes.
	if(this.gestures_buffer.length < 10) return;
	
	// Copy the gestures buffer.
	var gestures_buffer = [].concat(this.gestures_buffer);
	
	// Trim the gestures buffer.
	this.gestures_buffer.splice(0, 10);
	
	
	
	/*** Processing gesture data ***/
	
	// Directions in order of priority.
	var directions = {
		left : 0,
		right : 0,
		up : 0,
		down : 0,
	};
	
	var total_speed = 0;
	
	var total_fingers = 0;
	
	var total_tilted = 0;
	
	// [ Min , Max ]
	var x_limits = [0, 0];
	
	for(var i in gestures_buffer)
	{
		// Add points to this direction based on speed
		directions[gestures_buffer[i].direction] += Math.round(gestures_buffer[i].speed);
		
		// Add speed to the speed total.
		total_speed += gestures_buffer[i].speed;
		
		total_fingers += gestures_buffer[i].fingers;
		
		total_tilted += gestures_buffer[i].tilted ? 1 : 0;
		
		if(gestures_buffer[i].axis == 'x')
		{
			if(gestures_buffer[i].position < x_limits[0])
			{
				x_limits[0] = gestures_buffer[i].position;
			}
			else if(gestures_buffer[i].position > x_limits[1])
			{
				x_limits[1] = gestures_buffer[i].position;
			};
		};
	};
	
	
	// Get the average count of fingers.
	var avg_fingers = Math.round(total_fingers / gestures_buffer.length);
	
	// Get the average of tilted frames.
	var avg_tilted = total_tilted / gestures_buffer.length;
	
	
	
	/*** Defining direction ***/
	
	// Define the average direction.
	var avg_direction = null;
	var prev_avg_direction = null;
	var highest_direction_score = 0;
	for(var i in directions)
	{
		if(directions[i] > highest_direction_score)
		{
			// Update the last previous average direction.
			prev_avg_direction = avg_direction;
			
			// Set the new previous average direction.
			highest_direction_score = directions[i];
			avg_direction = i;
		};
	};
	
	// Prevent triggering motions without a clear motion direction.
	if(avg_direction && prev_avg_direction)
	{
		var directions_speed_alpha = directions[avg_direction] / directions[prev_avg_direction];
		
		if(directions_speed_alpha > this.Clear_Direction_Speeds_Ratio_Threshold)
		{
			return;
		};
	};
	
	
	/*** Defining speed ***/
	
	// Define the average speed.
	var avg_speed = Math.round(total_speed / gestures_buffer.length);
	
	// Require that horizontal swipes are long enough
	if(avg_direction == 'left' || avg_direction == 'right')
	{
		if(x_limits[1] - x_limits[0] < this.Swipe_Length_Threshold)
		{
			can_trigger = false;
		};
	};
	
	
	
	/*** Defining what to trigger ***/
	
	if(can_trigger)
	{
		console.log(avg_tilted);
		if(avg_tilted > 0.5)
		{
			// Tilted gestures are always considered Swipes.
			var gesture_name = 'swipe';
			
			//document.title = 'tilted';
		}
		else
		{
			// Decide the type of gesture based on fingers count.
			var gesture_name = avg_fingers > 2 ? 'swipe' : 'slide';
			
			//document.title = 'not tilted : ' + avg_fingers;
		};
		
		// Trigger the swipe gesture.
		this.triggerGesture({
			name : gesture_name,
			direction : avg_direction,
			speed : avg_speed
		});
		
		// Trigger the swipe up, down, left or right gesture.
		this.triggerGesture({
			name : gesture_name + this.capitaliseFirstLetter(avg_direction),
			speed : avg_speed
		});
		
		// Stops tracking until personal cooldown goes off.
		this.pauseTracking();
	};
};

/**
 * Returns the Axis (x, y), Value (1, -1) and Direction (up, down, left, right) of a motion.
 */
SwipeGesture.prototype.getMotion = function(gesture, frame)
{
	var motion = {
		// Negative / Positive  ==  Left / Right
		x : gesture.direction.x * this.Horizontal_Vertical_Priority_ratio,	
		// Negative / Positive  ==  Down / Up
		y : gesture.direction.y,
		z : gesture.direction.z
	};
	
	// Ignore depth swipes.
	if(Math.abs(motion.z) >= 0.5)
	{
		return false;
	};
	
	// Decide swipe axis by comparing which motion is stronger,
	// preventing unintended swipes.
	var axis = Math.abs(motion.x) > Math.abs(motion.y) ? 'x' : 'y';
	
	// [PATCH] Disabled. So crappy it does not work.
	var tilted = false;
	/*if(frame.hands[0])
	{
		tilted = Math.abs(frame.hands[0].rotation.xBasis.y) > this.Swipe_Z_Hand_Rotation_Threshold;
	};*/
	
	
	
	return {
		axis : axis,
		value : (motion[axis] > 0 ? 1 : -1),
		direction : (axis == 'x' ? (motion[axis] > 0 ? 'right' : 'left') : (motion[axis] > 0 ? 'up' : 'down')),
		position : gesture.position[axis],
		tilted : tilted
	};
};

Leaper.appendGesture('swipe', new SwipeGesture());








/*** Keyboard Gesture ***/

function KeyboardGesture()
{
	// Array tracking the last swipes in a given period of time.
	this.gestures_buffer = [];
	
	// Set to false to temporarily stop tracking gestures.
	this.track_gestures = true;
	
	// Whether the last status is in our out.
	this.keyboard_status = 'out';
	
	// Counter of how many frames do not have hands while "keyboard in".
	this.no_hands_counter = 0;
	
	// Setting: How long in miliseconds to track for motions.
	this.Tracking_Time_Length = 350;
	
	// Setting: How long to wait after successful trigger.
	this.Trigger_Cooldown = 300;
	
	// Setting: Maximum hands Z position to detect.
	this.Hands_Z_Threshold = 180; // 80
	
	// Setting: Minimum required fingers to accept a swipe.
	this.Gesture_Finger_Count_Threshold = 3;
	
	// Setting: The higher, less horizontal & vertical translation on depth motions
	// is required to consider such as a depth motion.
	this.Depth_Priority_ratio = 1.5;
	
	// Setting: Minimum required speed to accept the motion.
	this.Hands_Speed_Threshold = 100;
	
	// Setting: How many frames to count no hands detected before
	// declaring "keyboard out".
	this.No_Hands_Frames_Threshold = 50;
};
KeyboardGesture.prototype = new LeaperGesture();
KeyboardGesture.prototype.constructor = KeyboardGesture;

KeyboardGesture.prototype.loop = function(frame)
{
	if(frame.hands.length > 0)
	{
		// Reset the no hands counter.
		this.no_hands_counter = 0;
	}
	
	if(frame.hands.length == 2)
	{
		// Return if we are not allowed to track swipes again.
		if(!this.track_gestures) return;
		
		var motions = [
			this.getMotion(frame.hands[0]),
			this.getMotion(frame.hands[1])
		];
		
		
		// Continue only if we have a valid pair of motions.
		if(motions[0] !== false && motions[1] !== false)
		{
			// Continue only if hands move on the same direction.
			if(motions[0].direction == motions[1].direction)
			{
				// Stop buffering gestures *certain time* after the first gesture.
				if(this.gestures_buffer.length == 0)
				{
					setTimeout(this.processGestures.bind(this), this.Tracking_Time_Length);
				};
				
				// Append this swipe to the buffer.
				this.gestures_buffer.push(motions);
			};
		};
	}
	else(frame.hands.length == 0)
	{
		if(this.keyboard_status == 'in')
		{
			// Increment the no hands counter.
			//this.no_hands_counter ++;
			
			// Trigger a keyboard out if no hands were detected by so long.
			if(this.no_hands_counter > this.No_Hands_Frames_Threshold)
			{
				// Trigger the swipe gesture.
				this.triggerGesture({
					name : 'keyboard',
					direction : 'out',
					speed : this.Hands_Speed_Threshold
				});
				
				// Trigger the swipe up, down, left or right gesture.
				this.triggerGesture({
					name : 'keyboardOut',
					speed : this.Hands_Speed_Threshold
				});
				
				// Store the keyboard status.
				this.keyboard_status = 'out';
				
				// Reset the counter.
				this.no_hands_counter = 0;
			};
		};
	};
};

/**
 * Averages and triggers buffered gestures.
 */
KeyboardGesture.prototype.processGestures = function()
{
	// Return if there are no buffered swipes.
	if(this.gestures_buffer.length == 0) return;
	
	// Directions in order of priority.
	var directions = {
		'in' : 0,
		'out' : 0
	};
	
	var total_speed = 0;
	
	for(var i in this.gestures_buffer)
	{
		// Fetch a hands average.
		var hands_average = this.averageHands(this.gestures_buffer[i]);
		
		// Add a point to this direction.
		directions[hands_average.direction] += 1;
		
		// Add speed to the speed total.
		total_speed += hands_average.speed;
	};
	
	var directions_log = '';
	
	// Define the average direction.
	var avg_direction = null;
	var highest_direction_score = 0;
	for(var i in directions)
	{
		if(directions[i] > highest_direction_score)
		{
			highest_direction_score = directions[i];
			avg_direction = i;
		};
		
		directions_log += i + ': ' + directions[i] + ' — ';
	};
	
	// Define the average speed.
	var avg_speed = Math.round(total_speed / this.gestures_buffer.length);
	
	// Do only trigger if the motion is fast enough.
	// Prevents unintended hands in/out.
	if(avg_speed > this.Hands_Speed_Threshold)
	{
		// Trigger the swipe gesture.
		this.triggerGesture({
			name : 'keyboard',
			direction : avg_direction,
			speed : avg_speed
		});
		
		// Trigger the swipe up, down, left or right gesture.
		this.triggerGesture({
			name : 'keyboard' + this.capitaliseFirstLetter(avg_direction),
			speed : avg_speed
		});
		
		// Store the keyboard status.
		this.keyboard_status = avg_direction;
	};
	
	// Clear buffer.
	this.gestures_buffer = [];
	
	// Stop tracking and resume after *certain time*.
	this.track_gestures = false;
	setTimeout(this.resumeTracking.bind(this), this.Trigger_Cooldown);
};

/**
 * Averages a pair of hands motions into a single one.
 */
KeyboardGesture.prototype.averageHands = function(hands)
{
	var total_speed = 0;
	
	for(var i in hands)
	{
		total_speed += hands[i].speed;
	};
	
	// Calculate average speed.
	var avg_speed = total_speed / hands.length;
	
	// [PATCH] Using first hand to determine direction.
	// It will work on THIS case, but should still poll through all hands.
	return {
		direction : hands[0].direction,
		speed : avg_speed
	};
};


/**
 * Returns the Speed, Value (1, -1) and Direction (up, down, left, right) of a motion.
 */
KeyboardGesture.prototype.getMotion = function(hand)
{
	var motion = {
		x : hand.palmVelocity.x,
		y : hand.palmVelocity.y,
		z : hand.palmVelocity.z * this.Depth_Priority_ratio
	};
	
	// Ignore horizontal or vertical motions.
	if(Math.abs(motion.x) >= Math.abs(motion.z) && Math.abs(motion.y) >= Math.abs(motion.z))
	{
		return false;
	};
	
	// Ignore too far fetched palm movements.
	if(hand.palmPosition.z > this.Hands_Z_Threshold)
	{
		return false;
	};
	
	return {
		axis : 'z',
		value : (hand.palmVelocity.z > 0 ? 1 : -1),
		direction : (hand.palmVelocity.z > 0 ? 'out' : 'in'),
		speed : Math.abs(hand.palmVelocity.z)
	};
};

Leaper.appendGesture('keyboard', new KeyboardGesture());





/*** Pointer Gesture ***/

function PointerGesture()
{
	// Array tracking the last swipes in a given period of time.
	this.gestures_buffer = [];
	
	// Set to false to temporarily stop tracking gestures.
	this.track_gestures = true;
	
	// Set to true when currently tracking a pointer.
	this.pointer_status = false;
	
	// Setting: Maximum hands Z position to detect.
	this.Finger_Z_Threshold = 80;
	
	// Setting: Required Z value to consider the interaction cancelled.
	this.Hands_Leave_Z_Threshold = 200;
	
	// Setting: How much translation to ignore when trying
	// to detect a still finger.
	this.Pointer_Shake_Threshold = 20;
	
	// Setting: How long in miliseconds to track for motions.
	this.Tracking_Time_Length = 350;
};
PointerGesture.prototype = new LeaperGesture();
PointerGesture.prototype.constructor = PointerGesture;

PointerGesture.prototype.loop = function(frame)
{
	// Return if we are not allowed to track swipes again.
	if(!this.track_gestures) return;
	
	if(frame.hands.length == 1 && frame.fingers.length >= 1 && frame.fingers.length <= 2)
	{
		if(this.pointer_status === false)
		{
			var finger_motion = this.getMotion(frame.fingers[0]);
			
			if(finger_motion)
			{
				// Append this swipe to the buffer.
				this.gestures_buffer.push(finger_motion);
				
				// Once we have enough samples, attempt to capture a gesture.
				if(this.gestures_buffer.length >= 15)
				{
					this.processGestures();
				};
				
				if(this.clear_buffer_timeout) clearTimeout(this.clear_buffer_timeout);
				this.clear_buffer_timeout = setTimeout((function()
				{
					this.gestures_buffer = []; 
				}).bind(this), this.Tracking_Time_Length);
			};
		};
	}
	else
	{
		
		// If we are pointing, track for when we stop doing so.
		if(this.pointer_status === true && (frame.fingers.length > 2 || frame.fingers.length < 1))
		{
			this.gestures_buffer.push(false);
			
			// Once we have enough samples, attempt to capture a gesture.
			if(this.gestures_buffer.length >= 15)
			{
				this.processGestures();
			};
		}
	};
};

/**
 * Restores buffered gestures.
 */
PointerGesture.prototype.restoreGestures = function()
{
	this.gestures_buffer = [];
};

/**
 * Averages and triggers buffered gestures.
 */
PointerGesture.prototype.processGestures = function()
{
	// Copy the gestures buffer.
	var gestures_buffer = [].concat(this.gestures_buffer);
	
	// Trim the gestures buffer.
	this.gestures_buffer.splice(0, 4);
	
	if(this.pointer_status === false)
	{
		var steady_count = 0;
		
		for(var i in gestures_buffer)
		{
			if(gestures_buffer[i])
			{
				if(gestures_buffer[i].steady === true)
				{
					steady_count ++;
				};
			};
		};
		
		if(steady_count >= 10)
		{
			// Set we are now tracking a pointer.
			this.pointer_status = true;
			
			// Trigger the gesture.
			this.triggerGesture({
				name : 'pointerStart'
			});
		};
	}
	else
	{
		var fail_count = 0;
		
		for(var i in gestures_buffer)
		{
			if(gestures_buffer[i] === false)
			{
				fail_count ++;
			};
		};
		
		if(fail_count >= 10)
		{
			// Set we are no longer tracking a pointer.
			this.pointer_status = false;
			
			// Trigger the gesture.
			this.triggerGesture({
				name : 'pointerEnd'
			});
			
			// Stops tracking until personal cooldown goes off.
			this.pauseTracking();
		};
	};
};

PointerGesture.prototype.getMotion = function(finger)
{
	if(!finger.tipPosition || !finger.tipVelocity)
	{
		return false;
	};
	
	// Ignore too far fetched finger movements.
	if(finger.tipPosition.z > this.Finger_Z_Threshold)
	{
		return false;
	};
	
	var velocity = {
		x : Math.abs(finger.tipVelocity.x),
		y : Math.abs(finger.tipVelocity.y),
		z : Math.abs(finger.tipVelocity.z)
	};
	
	var steady = velocity.x < this.Pointer_Shake_Threshold && velocity.y < this.Pointer_Shake_Threshold && velocity.z < this.Pointer_Shake_Threshold;
	
	return {
		position : finger.tipPosition,
		velocity : finger.tipVelocity,
		steady : steady
	};
};

Leaper.appendGesture('pointer', new PointerGesture());