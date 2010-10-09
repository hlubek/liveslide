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
	var presentation, slide1, slide2, slide3;
	presentation = {
		_id: 'presentation-welcome',
		type: 'presentation',

		name: 'welcome',
		theme: 'typo3',
		slides: ['introduction', 'animations', 'code', 'end']
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
		_id: 'presentation-welcome-slide-animations',
		type: 'slide',

		presentation: 'welcome',
		name: 'animations',
		content: 'h1 Animations \n\
\n\
ul \n\
  li LiveSlide supports slide transitions by default... \n\
  li(class="show-1") \n\
    | And also in-slide animation. \n\
    ul \n\
      li Specify the number of in-slide animations in the slide editor. \n\
      li(class="show-2") Add the css class <b>show-[number]</b> to the elements you want to animate.  [number] specifies the animation order. \n\
      li(class="show-3") With the property <b>anim-[number]</b> the effect can be specified. \n\
      li(class="show-4", anim-4="rotate") <b>rotate</b> effect. \n\
      li(class="show-5", anim-5="moveFromLeft") <b>moveFromLeft</b> is also possible. \n\
      li(class="show-6", anim-6="moveFromRight") <b>moveFromRight</b> is also possible. \n\
      li(class="show-7", anim-7="moveFromTop") <b>moveFromTop</b> is also possible. \n\
      li(class="show-8", anim-8="moveFromBottom") <b>moveFromBottom</b> is also possible. \n\
',
		animationSteps: 8
	};
	db.saveDoc(slide2._id, slide2);

	slide3 = {
		_id: 'presentation-welcome-slide-code',
		type: 'slide',

		presentation: 'welcome',
		name: 'code',
		content: 'h1 Code highlighting\n\
\n\
pre(class="prettyprint")\n\
  | &lt;xml&gt;\n\
  |   SomeText\n\
  | &lt;/xml&gt;\n\
pre(class="prettyprint")\n\
  :cdata\n\
    | <br />\n\
    | protected $bla = \'Test\';\n\
    | protected function myFunction($a, $b, $c) {\n\
    |   $this->bla = $a;\n\
    | }'	};
	db.saveDoc(slide3._id, slide3);

	slide4 = {
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
	db.saveDoc(slide4._id, slide4);
}