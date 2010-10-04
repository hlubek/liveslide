exports.initialize = function(db) {
	db.exists(function(er, exists) {

		if (!exists) {
			console.log("Creating fresh database!");
			db.create(function() {

				db.saveDesign('app', {
					views: {
						'byType': {
							map: function(doc) {
								emit(doc.type, doc);
							}
						}
					}
				});
				createExampleData(db);
			});
		}
	});
}

function createExampleData(db) {
	var presentation, slide1, slide2;
	presentation = {
		_id: 'presentation-welcome',
		type: 'presentation',

		name: 'welcome',
		theme: 'typo3',
		slides: ['introduction', 'end']
	};
	db.saveDoc(presentation._id, presentation);

	slide1 = {
		_id: 'presentation-welcome-slide-introduction',
		type: 'slide',

		presentation: 'welcome',
		name: 'introduction',
		content: 'h1 Welcome to LiveSlide\n'
			+'\n'
			+'ul\n'
			+'  li This presentation gives you an overview of what LiveSlide is, why it is so great and what we use it for.\n'
			+'  li Please push the right arrow key to continue.\n'
	};
	db.saveDoc(slide1._id, slide1);

	slide2 = {
		_id: 'presentation-welcome-slide-end',
		type: 'slide',

		presentation: 'welcome',
		name: 'end',
		content: 'h1 The End\n'
			+'\n'
			+'ul\n'
			+'  li This is the end of the LiveSlide walkthrough. Thanks for joining!\n'
			+'  li Have fun :-)\n'
	};
	db.saveDoc(slide2._id, slide2);
}