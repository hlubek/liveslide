LiveSlide = {};
LiveSlide.PresentationClient = {
	// socket.io object
	socket: null,
	animationRunning:false,

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
			if (LiveSlide.PresentationClient.animationRunning) return;

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
		window.setTimeout(this._slideChanged, 1010);
		LiveSlide.PresentationClient.animationRunning = true;
	},
	_startAnimation: function() {
		jQuery('#slideContainer').addClass('animationRunning');
	},
	_slideChanged: function() {
		jQuery('.currentSlide').remove();
		jQuery('.nextSlide').addClass('currentSlide');
		jQuery('#slideContainer').removeClass('animationRunning');
		jQuery('.nextSlide').removeClass('nextSlide');
		LiveSlide.PresentationClient.animationRunning = false;
	}
};

LiveSlide.Presenter = {
	// socket.io object
	socket: null,
	initialize: function() {
		this.socket = new io.Socket(window.location.host.split(':')[0]);
		this.socket.connect();
		this.socket.on('message', function(data) {
			data = jQuery.parseJSON(data);
			if (data.type === 'showSlide') {
				LiveSlide.Presenter.showSlide(data.slide);
			}
			if (data.type === 'showNextSlide') {
				LiveSlide.Presenter.showNextSlide(data.slide);
			}
		});
		jQuery(document).keydown(function(e) {
			if (e.keyCode == 39) {
				LiveSlide.Presenter.nextSlide();
				return false;
			} else if (e.keyCode == 37) {
				LiveSlide.Presenter.previousSlide();
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
		jQuery('#presenterSlideContainer').html(slide.content);
	},
	showNextSlide: function(slide) {
		jQuery('#nextSlideContainer').html(slide.content);
	},
};


jQuery(function() {
	if (jQuery('#slideContainer').length > 0) {
		LiveSlide.PresentationClient.initialize();
	}

	if (jQuery('#presenterSlideContainer').length > 0) {
		LiveSlide.Presenter.initialize();
	}
});