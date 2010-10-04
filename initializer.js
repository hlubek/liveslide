exports.initialize = function(db) {
	db.exists(function(er, exists) {

		if (!exists) {
			console.log("Creating fresh database!");
			db.create(function() {
				db.saveDesign('app', {
					views: {
						"byType": {
							map: function(doc) {
								emit(doc.type, doc);
							}
						}
					}
				});
			});

			// TODO: Create example data
		}
	});

}