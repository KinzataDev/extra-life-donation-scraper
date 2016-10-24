var http = require('http');
var sprintf = require('sprintf');
var fs = require('fs');

// patricipant ids for extra-life
var userIds = [
	// Put participant ids here to gather and use multiple participant's data
];

var mostRecentDonations = [];

var largestDonorObj = {};
var largestDonations = [];

var totalRequests = userIds.length;
var numRequests = 0;

var MAX_NAME_LENGTH = 50;
var RECENT_DONATIONS_LIMIT = 5;
var LARGEST_DONATIONS_LIMIT = 10;

var LARGEST_DONOR_OUTPUT_FILE = "/tmp/largest_donation.txt";

var TOP_DONORS_STRING = "Top Donors: ";
var RECENT_DONORS_STRING = "Most Recent Donors: ";
var FILLER_STRING_1 = "CHANGE ME | ";
var FILLER_STRING_2 = "CHANGE ME | ";
var NULL_VALUE_REPLACEMENT = "Anonymous";

// Reset holding arrays, loop over users and pull down their donations
function updateCurrentDonations() {
	mostRecentDonations = [];
	largestDonations = [];
	numRequests = 0;

	userIds.forEach( function(id) {
		getDonationInfoJSON(id, addToCurrentData);
	})
}

// Make request to extra-life for a given user
function getDonationInfoJSON(userId, callback) {

    return http.get({
        host: 'www.extra-life.org',
        path: '/index.cfm?fuseaction=donorDrive.participantDonations&participantID=' + userId + '&format=json'
    }, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var parsed = JSON.parse(body);
			numRequests++;
			callback(parsed);
        });
    });
}

// Parse and clean user and donation data, add to each holding object
function addToCurrentData( data ) {
	data.forEach( function(e) {

		if( e.donorName == null ) {
			e.donorName = NULL_VALUE_REPLACEMENT;
		}
		else {
			e.donorName = e.donorName.substr(0, MAX_NAME_LENGTH);
		}

		if( e.donationAmount == null ) {
			e.donationAmount = NULL_VALUE_REPLACEMENT;
		}
		else {
			// Not a fan of this, but it works.  The fact that null values won't be a number is the reasoning
			e.donationAmount = "$" + e.donationAmount;
		}

		mostRecentDonations.push(e);
		addToLargestObj(e);
	});

	if( numRequests == totalRequests ) {
		buildSumDonations();
		sortAndRender();
	}
}

// Add donation to largest donation hash if it doesn't exist
function addToLargestObj(obj) {
	var name = obj.donorName;
	if( name == NULL_VALUE_REPLACEMENT ) {
		return;
	}

	var amount = obj.donationAmount;
	if( amount == NULL_VALUE_REPLACEMENT ) {
		return;
	}

	amount = amount.substr(1); // Remove the $

	var timestamp = obj.createdOn;

	// This was built this way so that this script can be ran over the same data multiple times
	// and not get dupliates.  Though that's not how it is currently running.
	if( largestDonorObj[name] ) {
		if( largestDonorObj[name][timestamp] ) {
			return;
		}
		else {
			largestDonorObj[name][timestamp] = amount;
		}
	}
	else {
		largestDonorObj[name] = {};
		largestDonorObj[name][timestamp] = amount;
	}
}

// Iterate over the largest donation hash and calculate the sums
function buildSumDonations() {
	for ( var name in largestDonorObj ) {
		var sum = 0;
		for ( var donation in largestDonorObj[name] ) {
			sum += parseInt(largestDonorObj[name][donation]);
		}

		largestDonations.push( {name: name, amount: sum} );
	}
}

// Sort data and write the list to output files to be used elsewhere
function sortAndRender() {
	largestDonations.sort( function(a,b) {
		return b.amount - a.amount;
	});

	mostRecentDonations.sort( function(a,b) {
		var a = new Date( a.createdOn );
		var b = new Date( b.createdOn );
		return b - a;
	});


	var outputString = TOP_DONORS_STRING;
	for( var i = 0; i < LARGEST_DONATIONS_LIMIT; i++ ) {
		var largestString = sprintf("%s: $%s | ", largestDonations[i].name, largestDonations[i].amount);
		outputString = outputString + largestString;
	}

	outputString = outputString + FILLER_STRING_1;
	outputString = outputString + RECENT_DONORS_STRING;
	for( var i = 0; i < RECENT_DONATIONS_LIMIT; i++ ) {
		var recentString = sprintf("%s: %s | ", mostRecentDonations[i].donorName, mostRecentDonations[i].donationAmount);
		outputString = outputString + recentString;
	}

	outputString = outputString + FILLER_STRING_2;
	fs.writeFile(LARGEST_DONOR_OUTPUT_FILE, outputString, function(err) {
		if(err) {
			return console.log(err);
		}
	});
}

updateCurrentDonations();
