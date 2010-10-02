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