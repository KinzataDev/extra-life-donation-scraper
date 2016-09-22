var fs = require('fs');
var sleep = require('sleep');
var process = require('child_process')

var SECONDS_PER_REQUEST = 10;

while(1) {
	var ls = process.execFile('node', ['index.js']);

	sleep.sleep(SECONDS_PER_REQUEST);
}
