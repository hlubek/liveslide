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
		this._resizeOuterContainer();
		jQuery(window).resize(this._resizeOuterContainer);
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
	},
	// Resize the whole outer container
	_resizeOuterContainer: function() {
		var verticalScalingFactor, horizontalScalingFactor, resultingScalingFactor;

		verticalScalingFactor = jQuery(window).height() / 768;
		horizontalScalingFactor = jQuery(window).width() / 1024;

		if (verticalScalingFactor < horizontalScalingFactor) {
			resultingScalingFactor = verticalScalingFactor;
		} else {
			resultingScalingFactor = horizontalScalingFactor;
		}
		jQuery('.outerContainer').css('-moz-transform', 'scale(' + resultingScalingFactor + ')');
		jQuery('.outerContainer').css('-webkit-transform', 'scale(' + resultingScalingFactor + ')');
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
		jQuery('.outerContainer.presenter #slideContainer').html(slide.content);
	},
	showNextSlide: function(slide) {
		jQuery('.outerContainer.presenter-nextSlide #slideContainer').html(slide.content);
	}
};


jQuery(function() {
	if (jQuery('.outerContainer.presenter').length > 0) {
		LiveSlide.Presenter.initialize();
	} else if (jQuery('.outerContainer').length > 0) {
		LiveSlide.PresentationClient.initialize();
	}
});