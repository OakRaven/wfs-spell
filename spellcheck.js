var fs = require('fs');
var Nodehun = require('nodehun');
var glob = require('glob');
var xml2js = require('xml2js');
var _ = require('underscore');
var Q = require('q');

var affbuf, dictbuf, dict,		// dictionary vars
	parser;						// xml vars
	

var initDictionary = function () {
	affbuf = fs.readFileSync('share/en_CA.aff');
	dictbuf = fs.readFileSync('share/en_CA.dic');
	dict = new Nodehun(affbuf, dictbuf);
}

var initParser = function () {
	parser = new xml2js.Parser();
}

var log = function (message) {
	console.log(message);
}

var loadFiles = function (path, callback) {
	glob(path + '/**/*.screen', function (err, files) {
		if (err) throw err;
		callback(null, files);
	});
};

var processFiles = function (screenFilenames, callback) {
	var results = [];

	log('Found ' + screenFilenames.length + ' screens.\n');

	_.each(screenFilenames, function (screen) {
		var screenResult = { name: screen, allWords: [], incorrectWords: [] };

		results.push(screenResult);

		extractScreenText(screenResult, function (phrases) {
			_.each(phrases, function (phrase) {
				screenResult.allWords = _.union(screenResult.allWords, phrase.split(' '));
			});
		});
	});
};

var extractScreenText = function (screenPath, callback) {
	callback(['This is a test', 'of the spel checker.']);
};

var spellCheck = function (screenItems, callback) {
	var spellingPromises = [];

	_.each(screenItems, function (screen) {
		_.each(screen.allWords, function (word) {
			spellingPromises.push(checkWord(screen, word));
		});
	});

	Q.all(spellingPromises)
		.then(function () {
			callback(screenItems);
		})
		.catch(function(err){
			console.log("ERROR: ", err);
		});
};

var checkWord = function (screen, word) {
	var deferred = Q.defer();

	dict.spellSuggest(word, function (err, correct) {
		if (err) deferred.reject(err);
		if (correct === false) {
			screen.incorrectWords.push(word);
		}

		deferred.resolve();
	});

	return deferred.promise;
};

var displayResults = function (results) {
	_.each(results, function (screen) {
		console.log(screen.name);
		console.log('Unique Words: ', screen.allWords.length);
		console.log('Misspelt Words: ', screen.incorrectWords.length);
	});
}

if (process.argv.length < 3) {
	log('Invalid WireFrame Sketcher project path.');
	process.exit(1);
} else {
	var wfsProjectPath = process.argv[2];

	log('Scanning ' + wfsProjectPath + '\n');

	initDictionary();
	initParser();
	loadFiles(wfsProjectPath, function (err, screenFilenames) {
		processFiles(screenFilenames, function (screens) {
			spellCheck(screens, function (results) {
				// setTimeout(function () { displayResults(results); }, 5000);
				displayResults(results);
			});
		});
	});
}

