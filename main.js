var fs = require('fs');
//var sleep = require('sleep');
var process = require('child_process')

var SECONDS_PER_REQUEST = 60;

setInterval(function(){
	var ls = process.execFile('node', ['index.js']);
	console.log(Date.now());
}, (SECONDS_PER_REQUEST * 1000));
