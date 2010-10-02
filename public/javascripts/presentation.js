LiveSlide = {};
LiveSlide.Client = {
	currentSlide: 0,
	nextSlide: function() {

		jQuery('#slide-' + LiveSlide.Client.currentSlide).addClass('liveSlideAnimation');
		jQuery('#slide-' + (LiveSlide.Client.currentSlide+1)).addClass('liveSlideAnimation');

		window.setTimeout(LiveSlide.Client._slideChanged, 1100);
	},
	_slideChanged: function() {

		jQuery('#slide-' + LiveSlide.Client.currentSlide)
			.removeClass('liveSlideAnimation')
			.addClass('hidden');

		jQuery('#slide-' + (LiveSlide.Client.currentSlide+1))
			.removeClass('liveSlideAnimation')
			.removeClass('top')
			.addClass('bottom');

		jQuery('#slide-' + (LiveSlide.Client.currentSlide+2))
			.removeClass('hidden')
			.addClass('top');

		LiveSlide.Client.currentSlide++;
	}
};

jQuery(function() {
	jQuery('#slideContainer div').addClass('shadow').addClass('hidden');
	jQuery('#slide-0')
		.removeClass('hidden')
		.addClass('bottom');

	jQuery('#slide-1')
		.removeClass('hidden')
		.addClass('top');
	if (jQuery('#slideContainer div').length > 0) {
		
		jQuery(document).keydown(function(e) {
			if (e.keyCode == 39) {
				LiveSlide.Client.nextSlide();
				return false;
			}
		});

		socket = new io.Socket(window.location.host.split(':')[0]);
		socket.connect();
		socket.on('message', function(data) {
			data = jQuery.parseJSON(data);
			if (data.type === 'slidechange') {
				jQuery('#slideContainer div[data-slide="' + data.slide + '"]').load(
					'/presentation/' + data.presentation + '/slide/' + data.slide + '?format=partial')
			}
		});
	}
});
