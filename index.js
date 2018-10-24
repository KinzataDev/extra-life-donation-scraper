var sprintf = require('sprintf');
var fs = require('fs');
var extraApi = require('extra-life-api');

// patricipant ids for extra-life
var userIds = [
];

var teamId = 0; // Replace with Team ID

var mostRecentDonations = [];

var largestDonorObj = {};
var largestDonations = [];

var totalRequests = userIds.length;
var numRequests = 0;

var MAX_NAME_LENGTH = 50;
var RECENT_DONATIONS_LIMIT = 5;
var LARGEST_DONATIONS_LIMIT = 10;

var DONOR_FILE = "/tmp/largest_donation.txt";
var TOTAL_DONATION_AMOUNT_FILE = "/tmp/largest_donation.txt";

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

	extraApi.getUserDonations(userId)
		.then((data) => 
		{	
			numRequests++;
			callback(data.donations);
		})
		.catch(() => {
			console.log(e);
	   });
}

// Parse and clean user and donation data, add to each holding object
function addToCurrentData( data ) {
	data.forEach( function(e) {

		if( e.displayName == "Anonymous" ) {
			e.displayName = NULL_VALUE_REPLACEMENT;
		}
		else {
			e.displayName = e.displayName.substr(0, MAX_NAME_LENGTH);
		}

		if( e.amount == null ) {
			e.amount = NULL_VALUE_REPLACEMENT;
		}
		else {
			// Not a fan of this, but it works.  The fact that null values won't be a number is the reasoning
			e.amount = "$" + e.amount;
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
	var name = obj.displayName;
	if( name == NULL_VALUE_REPLACEMENT ) {
		return;
	}

	var amount = obj.amount;
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
		var a = new Date( a.createdDateUTC );
		var b = new Date( b.createdDateUTC );
		return b - a;
	});

	var largestLoopLimit = largestDonations.length > LARGEST_DONATIONS_LIMIT ? LARGEST_DONATIONS_LIMIT : largestDonations.length;
	var recentLoopLimit = mostRecentDonations.length > RECENT_DONATIONS_LIMIT ? RECENT_DONATIONS_LIMIT : mostRecentDonations.length;

	var outputString = TOP_DONORS_STRING;
	for( var i = 0; i < largestLoopLimit; i++ ) {
		var largestString = sprintf("%s: $%s - ", largestDonations[i].name, largestDonations[i].amount);
		outputString = outputString + largestString;
	}

	outputString = outputString + FILLER_STRING_1;
	outputString = outputString + RECENT_DONORS_STRING;
	for( var i = 0; i < recentLoopLimit; i++ ) {
		var recentString = sprintf("%s: %s - ", mostRecentDonations[i].displayName, mostRecentDonations[i].amount);
		outputString = outputString + recentString;
	}

	outputString = outputString + FILLER_STRING_2;
	fs.writeFile(DONOR_FILE, outputString, function(err) {
		if(err) {
			return console.log(err);
		}
	});

}

function renderTotal() {
	extraApi.getTeamInfo(teamId)
	.then((data) =>
	{
		fs.writeFile(TOTAL_DONATION_AMOUNT_FILE, data.sumDonations, function(err) {
			if(err) {
				return console.log(err);
			}
		});
	})
	.catch(() => {
         console.log(e);
    });
}

updateCurrentDonations();
renderTotal();
