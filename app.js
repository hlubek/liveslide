
/**
 * Module dependencies.
 */

var express = require('express'),
    connect = require('connect'),
    jade = require('jade'),
    io = require('socket.io'),
    utils = require('./lib/utils'),
    couchdb = require('./lib/node-couchdb/couchdb'),
    // TODO Move to JSON config
	client = couchdb.createClient(5984, 'localhost'),
	db = client.db('liveslide'),
	initializer = require('./initializer');

var app = module.exports = express.createServer();

initializer.initialize(db);

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.use(connect.bodyDecoder());
    app.use(connect.methodOverride());
    //app.use(connect.compiler({ src: __dirname + '/public', enable: [] }));
    app.use(app.router);
    app.use(connect.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(connect.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
   app.use(connect.errorHandler());
});

var currentPresentationName = null; // Name of presentation currently being played.
var currentSlide = null; // Name of slide currently being shown.
var currentSlideAnimationSteps = 0; // Number of slide animation steps. Used for in-slide animations.
var currentSlidePart = 0; // Number of slide part which is currently being shown. Used for in-slide animations.

var socket = io.listen(app);
socket.on('connection', function(client){
	// new client is here!
	client.on('message', function(message) {
		if (message === 'nextSlide') {
			if (currentSlideAnimationSteps > 0 && currentSlidePart < currentSlideAnimationSteps) {
				// We want to animate the current slide, instead of showing a new one.
				currentSlidePart++;
				socket.broadcast(JSON.stringify({type: 'showSlidePart', slidePart: currentSlidePart}));
			} else {
				// We want to show a new slide.
				currentSlide++;
				pushCurrentSlideToClient();
			}
		} else if (message === 'previousSlide') {
			currentSlide--;
			pushCurrentSlideToClient();
		}
		console.log('socket.io message', JSON.stringify(message));
	});
	client.on('disconnect', function(){
		console.log('socket.io disconnect', JSON.stringify(arguments));
	});
});

function pushCurrentSlideToClient() {
	db.getDoc(currentPresentationName, function(er, presentation) {
		var currentSlideName = presentation.slides[currentSlide];
		var nextSlideName = presentation.slides[currentSlide+1];
		db.getDoc(currentPresentationName + '-slide-' + currentSlideName, function(er, currentSlide) {
			if (er) {
				console.log(JSON.stringify(er));
				return;
			}
			currentSlideAnimationSteps = currentSlide.animationSteps;
			currentSlidePart = 0;
			currentSlide.content = jade.render(currentSlide.content, {});
			socket.broadcast(JSON.stringify({type: 'showSlide', slide: currentSlide}));
		});

		db.getDoc(currentPresentationName + '-slide-' + nextSlideName, function(er, nextSlide) {
			if (er && er.error === 'not_found') {
				socket.broadcast(JSON.stringify({type: 'showNextSlide', slide: {
					content: ''
				}}));
				return;
			}

			nextSlide.content = jade.render(nextSlide.content, {});
			socket.broadcast(JSON.stringify({type: 'showNextSlide', slide: nextSlide}));
		});


	});
}

function slideId(presentationName, slideName) {
	return 'presentation-' + presentationName + '-slide-' + slideName;
};



// Routes

app.get('/', function(req, res) {
	db.view('app', 'byType', {key: 'presentation'}, function(er, data) {
		var presentations, titleslideIds;
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}

		presentations = data.rows.map(function(row) { return row.value; });
		titleslideIds = presentations.map(function(presentation) {
			return slideId(presentation.name, presentation.slides[0]);
		});

		db.allDocs({keys: titleslideIds}, {include_docs: true}, function(er, data) {
			var titleslides = {};
			if (er) {
				return res.send(JSON.stringify(er), 500);
			}
			data.rows.forEach(function(row) {
				if (row.error) return;
				titleslides[row.doc.presentation] = row.doc;
				titleslides[row.doc.presentation].content = jade.render(row.doc.content, {});
			});

			res.render('index.jade', {
				locals: {
					title: 'Welcome to LiveSlide',
					presentations: presentations,
					titleslides: titleslides
				}
			});
		});		
    });
});

app.post('/presentation', function(req, res) {
	var presentation = { type: 'presentation', name: req.body.name, slides: [] };
	db.saveDoc('presentation-' + presentation.name, presentation, function(er, ok) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}
		res.redirect('/presentation/' + presentation.name);
	});
});

// Manage presentation
app.get('/presentation/:name', function(req, res) {
	db.getDoc('presentation-' + req.params.name, function(er, presentation) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}
		res.render('presentation.jade', {
			locals: {
				title: 'Presentation ' + presentation.name,
				presentation: presentation
			}
		});
	});
});

// Update presentation properties like theme
app.post('/presentation/:name', function(req, res) {
	db.getDoc('presentation-' + req.params.name, function(er, presentation) {
		presentation.theme = req.body.theme;
		db.saveDoc(presentation._id, presentation, function(er, ok) {
			if (er) {
				return res.send(JSON.stringify(er), 500);
			}
			res.redirect('/presentation/' + presentation.name);
		});
	});
});

// Play presentation
app.get('/presentation/:name/play', function(req, res) {
	db.getDoc('presentation-' + req.params.name, function(er, presentation) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}
		currentPresentationName = presentation._id;
		currentSlide = -1;

		var presentationTheme = (presentation.theme ? presentation.theme : 'default');
		res.render('../themes/' + presentationTheme + '.jade', {
			locals: {
				title: presentation.name,
				presentation: presentation
			}
		});
	});
});

// Presenter Monitor
app.get('/presentation/:name/presenter', function(req, res) {
	db.getDoc('presentation-' + req.params.name, function(er, presentation) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}
		currentPresentationName = presentation._id;
		currentSlide = -1;

		var presentationTheme = (presentation.theme ? presentation.theme : 'default');
		res.render('presentation-presenter.jade', {
			locals: {
				title: presentation.name,
				presentation: presentation
			}
		});
	});
});

// Create slide
app.post('/presentation/:presentation/slide', function(req, res) {
	var slide = { type: 'slide', presentation: req.params.presentation, name: req.body.name, content: 'Empty content', animationSteps: 0 };

	// Save slide
	db.saveDoc('presentation-' + slide.presentation + '-slide-' + slide.name, slide, function(er, ok) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}
		// Get presentation
		db.getDoc('presentation-' + req.params.presentation, function(er, presentation) {
			if (er) {
				return res.send(JSON.stringify(er), 500);
			}
			presentation.slides = presentation.slides || [];
			presentation.slides.push(req.body.name);
			// Update presentation
			db.saveDoc(presentation._id, presentation, function(er, ok) {
				if (er) {
					return res.send(JSON.stringify(er), 500);
				}
				res.redirect('/presentation/' + slide.presentation + '/slide/' + slide.name + '/edit');
			});
		});
	});
});

// Preview slide
app.get('/presentation/:presentation/slide/:name', function(req, res) {
	db.getDoc('presentation-' + req.params.presentation + '-slide-' + req.params.name, function(er, slide) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}

		content = jade.render(slide.content, {});

		if (req.query && req.query.format == 'partial') {
			res.send(content);
		} else {
			res.render('slide.jade', {
				locals: {
					title: req.params.name + ' / ' + req.params.presentation,
					slide: slide,
					content: content
				}
			});
		}
	});
});

// Edit slide
app.get('/presentation/:presentation/slide/:name/edit', function(req, res) {
	db.getDoc('presentation-' + req.params.presentation + '-slide-' + req.params.name, function(er, slide) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}

		res.render('slide-edit.jade', {
			locals: {
				title: 'Edit ' + req.params.name + ' / ' + req.params.presentation,
				slide: slide
			}
		});
	});
});

// Update slide
app.post('/presentation/:presentation/slide/:name', function(req, res) {
	db.getDoc('presentation-' + req.params.presentation + '-slide-' + req.params.name, function(er, slide) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}
		slide.content = req.body.content;
		slide.animationSteps = parseInt(req.body.animationSteps);
		db.saveDoc('presentation-' + slide.presentation + '-slide-' + slide.name, slide, function(er, ok) {
			if (er) {
				return res.send(JSON.stringify(er), 500);
			}

			// TODO: if current slide is visible...
			//pushCurrentSlideToClient(); // in case the current slide is just changed

			res.redirect('/presentation/' + slide.presentation + '/slide/' + slide.name);
		});
	});
});


// Only listen on $ node app.js

if (!module.parent) app.listen(3000);
