exports.merge = function(o1, o2) {
	var k1, k2, target = {};
	for (k1 in o1) {
		target[k1] = o1[k1];
	}
	for (k2 in o2) {
		target[k2] = o2[k2];
	}
	return target;
};
