# extra-life-donation-scraper
Rough Node.js script to gather the most recent and aggregate largest donations by name for a list of participant's.

This script was built to help out my local ExtraLife team.  Using a list of participant IDs, it hits the ExtraLife API and outputs two formatted text files: Recent Donations and Largest Dontations.

To use:

Fill in the list of participant IDs in index.js and adjust the constants to fit your usage.

Then simply run `node main.js` and the files will be filled with the relevant data.

This is not really optimized for large scale usage.  This is just a quick solution for my case specifically.
