$(document).ready(function()
{
	// Start Leaper.
	Leaper.start();
	
	Leaper.on('swipe', appendToGestures);
	Leaper.on('swipeUp', appendToGestures);
	Leaper.on('swipeDown', appendToGestures);
	Leaper.on('swipeLeft', appendToGestures);
	Leaper.on('swipeRight', appendToGestures);
	Leaper.on('slide', appendToGestures);
	Leaper.on('slideUp', appendToGestures);
	Leaper.on('slideDown', appendToGestures);
	Leaper.on('slideLeft', appendToGestures);
	Leaper.on('slideRight', appendToGestures);
	Leaper.on('keyboard', appendToGestures);
	Leaper.on('keyboardIn', appendToGestures);
	Leaper.on('keyboardOut', appendToGestures);
	Leaper.on('pointerStart', appendToGestures);
	Leaper.on('pointerEnd', appendToGestures);
	
	
	Leaper.on('swipe', swipeDummy);
	Leaper.on('slide', slideDummy);
	
	Leaper.on('loop', function(e)
	{
		$('#hands .hands').html(e.hands.length);
		$('#hands .fingers').html(e.fingers.length);
	});
	
	Leaper.on('keyboardIn', enterSearchMode);
	Leaper.on('keyboardOut', leaveSearchMode);
});

function appendToGestures(e)
{
	var obj = $('<li>' + e.name + ' — ' + e.speed + '</li>');
	
	$('#gestures ul').prepend(obj);
	
	setTimeout(function()
	{
		$(obj).remove(); 
	}, 5000);
};

var dummy_bg_position = [0, 0];
var dummy_translate_position = [0, 0];
var dummy_swipe_timout = null;

function swipeDummy(e)
{
	var Speed_Threshold = 0.1;
	
	var dummy = $('#dummy');
	
	switch(e.direction)
	{
		case 'left':
			dummy_translate_position[0] -= Math.round(e.speed * Speed_Threshold, 3);
			break;
		case 'right':
			dummy_translate_position[0] += Math.round(e.speed * Speed_Threshold, 3);
			break;
		case 'up':
			dummy_translate_position[1] -= Math.round(e.speed * Speed_Threshold, 3);
			break;
		case 'down':
			dummy_translate_position[1] += Math.round(e.speed * Speed_Threshold, 3);
			break;
	};
	
	dummy.css('-webkit-transform', 'translate3d(' + dummy_translate_position.join('px, ') + 'px, 0px)');
	
	// Restore position after a while of inactivity.
	if(dummy_swipe_timout) clearTimeout(dummy_swipe_timout);
	dummy_swipe_timout = setTimeout(function()
	{
		dummy_translate_position = [0, 0];
		dummy.css('-webkit-transform', 'translate3d(' + dummy_translate_position.join('px, ') + 'px, 0px)');
	}, 3000);
};

function scrollDummy(e)
{
	var Speed_Threshold = 0.1;
	
	var dummy = $('#dummy');
	
	switch(e.direction)
	{
		case 'left':
			dummy_bg_position[0] -= Math.round(e.speed * Speed_Threshold, 3);
			break;
		case 'right':
			dummy_bg_position[0] += Math.round(e.speed * Speed_Threshold, 3);
			break;
		case 'up':
			dummy_bg_position[1] -= Math.round(e.speed * Speed_Threshold, 3);
			break;
		case 'down':
			dummy_bg_position[1] += Math.round(e.speed * Speed_Threshold, 3);
			break;
	};
	
	dummy.css('background-position', dummy_bg_position.join('px ') + 'px');
};

var slide_timeout;

function slideDummy(e)
{
	var Speed_Threshold = 0.01;
	
	var duration = Math.max(0.1, Math.round(3 - e.speed * Speed_Threshold, 1));
	
	var dummy = $('#dummy');
	
	switch(e.direction)
	{
		case 'left':
			dummy.css('-webkit-animation', 'dummy-slide-left ' + duration + 's ease-out');
			break;
		case 'right':
			dummy.css('-webkit-animation', 'dummy-slide-right ' + duration + 's ease-out');
			break;
	};
	
	if(slide_timeout) clearTimeout(slide_timeout);
	
	slide_timeout = setTimeout(function()
	{
		dummy.css('-webkit-animation', '');
	}, 600);
};

function enterSearchMode()
{
	$('body').addClass('searching');
	
	$('#search input').focus();
};

function leaveSearchMode()
{
	$('body').removeClass('searching');
	
	$('#search input').blur();
};