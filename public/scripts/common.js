// ---------------------------------------------------------------------------------------------------------
// Knockout Custom Binding: Fade Text
// - Fade text briefly on update
// ---------------------------------------------------------------------------------------------------------
ko.bindingHandlers.fadeText = {
	init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		// This will be called when the binding is first applied to an element
		// Set up any initial state, event handlers, etc. here

		var value = ko.utils.unwrapObservable( valueAccessor() );
		
		$(element)
			.html(value)
			.hide()
			.fadeIn(500);
	},
	update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
		// This will be called once when the binding is first applied to an element,
		// and again whenever the associated observable changes value.
		// Update the DOM element based on the supplied values here.
/* 		$(element).hide().fadeIn(500); */
		
		var value = ko.utils.unwrapObservable( valueAccessor() );
		
		$(element).fadeOut(500, function(){
			$(element)
				.html(value)
				.fadeIn(500);	
		});
	}
};





// =================================================================================================
// Message
// - Message system for errors, alerts, successes
// - Inputs: text, type (success/error/warning/invalid/alert), delay length
// =================================================================================================
var messageTimeout;
function message(messageText, messageType, messageDelay, showBlackout){
	// Optional argument defaults
	if(typeof(messageType) === 'undefined') { messageType = 'alert'; }
	if(typeof(messageDelay) === 'undefined') { messageDelay = 1500; }
	if(typeof(showBlackout) === 'undefined') { showBlackout = false; }

	// Set message style
	if(messageType == 'success')		{ $('#messageAlert')
											.removeClass('error warning alert invalid')
											.addClass('success'); }
	else if(messageType == 'invalid')	{ $('#messageAlert')
											.removeClass('success warning alert error')
											.addClass('invalid'); }
	else if(messageType == 'error')		{ $('#messageAlert')
											.removeClass('success warning alert invalid')
											.addClass('error'); }
	else if(messageType == 'warning')	{ $('#messageAlert')
											.removeClass('success error alert invalid')
											.addClass('warning'); }
	else if(messageType == 'alert')		{ $('#messageAlert')
											.removeClass('success error warning invalid')
											.addClass('alert'); }
	else { console.error('Unknown message Type: ' + messageType); }
	
	// Set message text	
	$('#messageAlert .text').text(messageText);
	
	// Show Blackout Screen if specified
	if(showBlackout == true){
		if($('#blackoutScreen').is(':hidden')){
			$('#blackoutScreen').fadeToggle(500);
		}
	}
	
	// Show & animate the message
	// - To prevent message spam / queue: clear the delay timeout, stop the animation, & remove the style to reset it to original location
	clearTimeout(messageTimeout);
	$('#messageAlert')
		.stop()
		.removeAttr('style')
		.show()
		.animate({ 'marginTop': '80px', opacity: 1 }, 500, function() {
			// Keep the message displayed forever
			if(messageDelay == 'forever') { }
			// Show the message briefly
			else if(isInt(messageDelay)) {
				messageTimeout = setTimeout(function(){
					$('#messageAlert').animate({ 'marginTop': '0px', opacity: 1 }, 500, function(){
						$(this).hide();
					});
					
					// Remove Blackout Screen if visible
					if($('#blackoutScreen').is(':visible')){
						$('#blackoutScreen').fadeToggle(500);
					}
				}, messageDelay);
			}
			else{ console.error('Unknown message delay: ' + messageDelay); }
		});
	
	if(messageType == 'success')		{ console.log('Message: %c' + messageText, 'color: #7FFF6E;'); }
	else if(messageType == 'invalid')	{ console.log('Message: %c' + messageText, 'color: #FF6E6E;'); }
	else if(messageType == 'error')		{ console.error('Message: ' + messageText); }
	else if(messageType == 'warning')	{ console.log('Message: %c' + messageText, 'color: orange;'); }
	else if(messageType == 'alert')		{ console.log('Message: %c' + messageText, 'color: yellow;'); }
}

var elementMessageTimeout;
jQuery.fn.elementMessage = function(messageText, messageType, messageDelay){
	// Optional argument defaults
	if(typeof(messageType) === 'undefined') { messageType = 'alert'; }
	if(typeof(messageDelay) === 'undefined') { messageDelay = 1500; }

	this.each(function() {
		$('.elementMessageAlert').remove();
	
		var parentHeight = $('div', this).outerHeight();
		var parentTopOffset = $('div', this).offset().top;
		var elementMessage =	$(	'<div class="elementMessageAlert">'
								+		'<div class="interior">'
								+			'<div class="text"></div>'
								+		'</div>'
								+ 	'</div>');
		
		// Set message style
		if(messageType == 'success')		{ elementMessage.addClass('success'); }
		else if(messageType == 'invalid')	{ elementMessage.addClass('invalid'); }
		else if(messageType == 'error')		{ elementMessage.addClass('error'); }
		else if(messageType == 'warning')	{ elementMessage.addClass('warning'); }
		else if(messageType == 'alert')		{ elementMessage.addClass('alert'); }
		else { console.error('Unknown message Type: ' + messageType); }
		
		// Set message text	
		$('.text', elementMessage).html(messageText);
		
		// Show & animate the message
		// - To prevent message spam / queue: clear the delay timeout, stop the animation, & remove the style to reset it to original location
		clearTimeout(elementMessageTimeout);
		elementMessage
			.css({ top: parentTopOffset })
			.appendTo('body')
			//.animate({ 'marginTop': parentHeight, opacity: 1 }, 500, function() {
			.fadeIn(500, function(){
				// Keep the message displayed forever
				if(messageDelay == 'forever') { }
				// Show the message briefly
				else if(isInt(messageDelay)) {
					elementMessageTimeout = setTimeout(function(){
						elementMessage.fadeOut(500, function(){
							elementMessage.remove();
						});
					}, messageDelay);
				}
				else{ console.error('Unknown message delay: ' + messageDelay); }
			});
		
		if(messageType == 'success')		{ console.log('Message: %c' + messageText, 'color: #7FFF6E;'); }
		else if(messageType == 'invalid')	{ console.log('Message: %c' + messageText, 'color: #FF6E6E;'); }
		else if(messageType == 'error')		{ console.error('Message: ' + messageText); }
		else if(messageType == 'warning')	{ console.log('Message: %c' + messageText, 'color: orange;'); }
		else if(messageType == 'alert')		{ console.log('Message: %c' + messageText, 'color: yellow;'); }
	});
	
	return this;	
}

// =================================================================================================
// isInt / isFloat
// + Check if a variable is INT, FLOAT
// - Returns TRUE/FALSE
// =================================================================================================
function isInt(variable)	{ return typeof variable === 'number' && variable % 1 == 0; }
function isFloat(variable)	{ return typeof variable === 'number' && variable % 1 != 0; }

// =================================================================================================
// Shake (Animation Effect)
// + Animate a shake effect on an element
// - Input: (amount, distance, duration)
// =================================================================================================
jQuery.fn.shake = function(amount, distance, duration) {
	this.each(function() {
		// Reset and stop to prevent animation spam
		$(this)
			.stop(true)
			.removeAttr('style')
			.css({position:'relative'});

		// Animate shake effect
		for (var x=1; x<=amount; x++) {
			$(this)
				.animate({left:(distance*-1)}, (((duration/amount)/4)))
				.animate({left:distance}, ((duration/amount)/2))
				.animate({left:0}, (((duration/amount)/4)));
		}
	});
	return this;
};


// =================================================================================================
// Constrain Input
// + Prevent certain characters or keys from being used in an input element
// - Inputs: (regexpKeys, disallowedKeys, maxLength)
// 	[disallowedKeys] accepted arguments:
//		backspace delete tab esc enter end home insert pageup pagedown	pause numlock scrolllock
//		capslock left rightup down ctrl cmd alt shift copy cut paste drop
// =================================================================================================
var keyDownMappings = {8:'backspace', 46:'delete', 9:'tab', 27:'esc', 13:'enter', 35:'end',
						36:'home', 45:'insert',	33:'pageup', 34:'pagedown', 19:'pause', 144:'numlock',
						145:'scrolllock', 20:'capslock', 37:'left',39:'right', 38:'up', 40:'down' };

jQuery.fn.constrainInput = function(regexpKeys, blockedKeys, maxLength) {
	// Optional argument defaults
	if(typeof(blockedKeys) === 'undefined') { blockedKeys = false; }
	if(typeof(maxLength) === 'undefined') { maxLength = false; }
	
	blockedKeys = blockedKeys.split(' ');
	
	this.each(function() {
		// Prevent Copy
		$(this).on('copy', function(event) {
			if (blockedKeys.indexOf('copy') != -1) 	{ event.preventDefault(); }
		});
		// Prevent Cut
		$(this).on('cut', function(event) {
			if (blockedKeys.indexOf('cut') != -1) 	{ event.preventDefault(); }			
		});
		// Prevent Paste
		$(this).on('paste', function(event) {
			if (blockedKeys.indexOf('paste') != -1) { event.preventDefault(); }
		});
		// Prevent Drop
		$(this).on('drop', function(event) {
			if (blockedKeys.indexOf('drop') != -1) 	{ event.preventDefault(); }
		});
		// Prevent Keypress (characters)
		$(this).on('keypress', function(event) {
			// ignore enter keypress (handled in keydown)
			if(event.keyCode != 13){
				// Limit maxLength
				if(maxLength !== false) {
					if( $(this).val().length >= maxLength )	{ event.preventDefault(); }
				}
				// Prevent characters not specified in regexpKeys
				if(!regexpKeys.test(String.fromCharCode(event.keyCode))) {
					event.preventDefault();
				}
			}
		});
		// Prevent Keydown (keys/modifiers)
		$(this).on('keydown', function(event) {
			// --------------------------------------------------
			// KEYS/MODIFIERS
			// --------------------------------------------------
			// F1-F12				112 -> 123
			// Backspace			8
			// Delete				46
			// Tab					9
			// Enter				13
			// Esc					27
			// Page Up				33
			// Page Down			34
			// End					35
			// Home					36
			// Insert				45
			// Left					37
			// Up					38
			// Right				39
			// Down					40
			// Pause/Break			19
			// Caps Lock			20
			// Num lock				144
			// Scroll lock			145
			// Ctrl					17, event.ctrlKey
			// Cmd	(left)			91, event.metaKey
			// Cmd	(right)			93, event.metaKey			
			// Alt/Opt				18, event.altKey
			// Shift				16, event.shiftKey
			// --------------------------------------------------
			// CHARACTERS
			// --------------------------------------------------
			// Space					32
			// a-z						65 -> 90
			// A-Z						65 -> 90 + event.shiftKey
			// 0-9						48 -> 57
			// 0-9			(numpad)	96 -> 105
			// * + - . /	(numpad)	106 -> 111
			// ) ! @ # $ % ^ & * (		48 -> 57 + event.shiftKey
			// ` ~						192, 192 + event.shiftKey
			// - _						189, 189 + event.shiftKey
			// = +						187, 187 + event.shiftKey
			// [ {						219, 219 + event.shiftKey
			// ] }						221, 221 + event.shiftKey
			// \ |						220, 220 + event.shiftKey
			// ; :						186, 186 + event.shiftKey
			// ' "						222, 222 + event.shiftKey
			// , <						188, 188 + event.shiftKey
			// . >						190, 190 + event.shiftKey
			// / ?						191, 191 + event.shiftKey
			// --------------------------------------------------
			
			// Prevent keys specified in disallowedKeys input
			if ((blockedKeys.indexOf(keyDownMappings[event.keyCode]) != -1) ||
				(blockedKeys.indexOf('ctrl')  != -1 && event.ctrlKey) ||
				(blockedKeys.indexOf('cmd')   != -1 && event.metaKey) ||
				(blockedKeys.indexOf('alt')   != -1 && event.altKey)  ||
				(blockedKeys.indexOf('shift') != -1 && event.shiftKey))
			{
				console.log('prevented: ' + event.keyCode);
				event.preventDefault();
			}
			
		});

	});
	return this;
};



// ---------------------------------------------------------------------------------------------------------
// Start/End Console Section
// - Simplifies process for starting & ending console sections & timing
// ---------------------------------------------------------------------------------------------------------
function startConsoleSection(debugName) {
	console.time(debugName);
	console.group(debugName);
}

function endConsoleSection(debugName) {
	console.timeEnd(debugName);
	console.groupEnd();
}