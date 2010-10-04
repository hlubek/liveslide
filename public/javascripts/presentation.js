LiveSlide = {};
LiveSlide.PresentationClient = {
	// socket.io object
	socket: null,

	initialize: function() {
		this.socket = new io.Socket(window.location.host.split(':')[0]);
		this.socket.connect();
		this.socket.on('message', function(data) {
			data = jQuery.parseJSON(data);
			if (data.type === 'showSlide') {
				LiveSlide.PresentationClient.showSlide(data.slide);
			}
		});
		this.nextSlide();
		jQuery(document).keydown(function(e) {
			if (e.keyCode == 39) {
				LiveSlide.PresentationClient.nextSlide();
				return false;
			} else if (e.keyCode == 37) {
				LiveSlide.PresentationClient.previousSlide();
				return false;
			}
		}, this);
	},
	nextSlide: function() {
		this.socket.send('nextSlide');
	},
	previousSlide: function() {
		this.socket.send('previousSlide');
	},
	showSlide: function(slide) {
		jQuery('#slideContainer').append(jQuery('<div class="nextSlide"></div>').html(slide.content));
		window.setTimeout(this._startAnimation, 1); // Hack to force a browser re-draw, so he will properly animate the property changes on nextSlide.
		window.setTimeout(this._slideChanged, 1100);
	},
	_startAnimation: function() {
		jQuery('#slideContainer').addClass('animationRunning');
	},
	_slideChanged: function() {
		jQuery('.currentSlide').remove();
		jQuery('.nextSlide').addClass('currentSlide');
		jQuery('#slideContainer').removeClass('animationRunning');
		jQuery('.nextSlide').removeClass('nextSlide');
	}
};

jQuery(function() {
	/*jQuery('#slideContainer div').addClass('shadow').addClass('hidden');
	jQuery('#slide-0')
		.removeClass('hidden')
		.addClass('bottom');

	jQuery('#slide-1')
		.removeClass('hidden')
		.addClass('top');
	if (jQuery('#slideContainer div').length > 0) {
		console.log("YEAH");



	}*/

	if (jQuery('#slideContainer div').length > 0) {
		LiveSlide.PresentationClient.initialize();
	}
});
