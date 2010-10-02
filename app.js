
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
	db = client.db('liveslide');

var app = module.exports = express.createServer();


// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.use(connect.bodyDecoder());
    app.use(connect.methodOverride());
    app.use(connect.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(app.router);
    app.use(connect.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(connect.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
   app.use(connect.errorHandler()); 
});

/*
var exceptionError = function(req, res, e) {
    res.writeHead(500, {});
    res.write("Server error");
    res.close();

    e.stack = e.stack.split('\n');
    e.url = req.url;
    sys.log(JSON.stringify(e, null, 2));
  };
*/

var clients = {
	/*
	"presentationName": {
		"sessionId": true
	}
	
	*/
};

var socket = io.listen(app); 
socket.on('connection', function(client){  
  // new client is here! 
  client.on('message', function() {
  	console.log('socket.io message', JSON.stringify(arguments));
  });
  client.on('disconnect', function(){
  	console.log('socket.io disconnect', JSON.stringify(arguments));
  });
});


// Routes

app.get('/', function(req, res) {
	db.view('app', 'byType', {key: 'presentation'}, function(er, data) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}
		res.render('index.jade', {
			locals: {
				title: 'Welcome to LiveSlide',
				presentations: data.rows.map(function(row) { return row.value; })
			}
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

// Play presentation
app.get('/presentation/:name/play', function(req, res) {
	db.getDoc('presentation-' + req.params.name, function(er, presentation) {
		if (er) {
			return res.send(JSON.stringify(er), 500);
		}
		db.allDocs({keys: presentation.slides.map(function(name) { return 'presentation-' + presentation.name + '-slide-' + name })}, {include_docs: true}, function(er, data) {
			if (er) {
				return res.send(JSON.stringify(er), 500);
			}
			var slides = data.rows.map(function(row) {
				row.doc.content = jade.render(row.doc.content, {});
				return row.doc;
			});
			res.render('presentation-play.jade', {
				locals: {
					title: presentation.name,
					presentation: presentation,
					slides: slides
				}
			});
		});
		
	});
});

// Create slide
app.post('/presentation/:presentation/slide', function(req, res) {
	var slide = { type: 'slide', presentation: req.params.presentation, name: req.body.name, content: 'Empty content' };
	
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
		db.saveDoc('presentation-' + slide.presentation + '-slide-' + slide.name, slide, function(er, ok) {
			if (er) {
				return res.send(JSON.stringify(er), 500);
			}
			
			socket.broadcast(JSON.stringify({
				type: 'slidechange',
				presentation: slide.presentation,
				slide: slide.name
			}));
			
			res.redirect('/presentation/' + slide.presentation + '/slide/' + slide.name);
		});
	});
});


// Only listen on $ node app.js

if (!module.parent) app.listen(3000);
