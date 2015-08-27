var fs = require('fs');
var nodehun = require('nodehun');
var glob = require('glob');
var xml2js = require('xml2js');
var Q = require('q');

var affbuf, dictbuf, dict,		// dictionary vars
	parser;						// xml vars

var initDictionary = function () {
	affbuf = fs.readFileSync('share/en_CA.aff');
	dictbuf = fs.readFileSync('share/en_CA.dic');
	dict = new nodehun(affbuf, dictbuf);
}

var initParser = function () {
	parser = new xml2js.Parser();
}

var log = console.log;

var loadFiles = function () {
	var deferred = Q.defer();

	glob(wfsProjectPath + '/**/*.screen', function (err, screenFiles) {
		if (err) deferred.reject(err);
		deferred.resolve(screenFiles);
	});

	return deferred.promise;
}

var processFiles = function (screens) {
	var deferred = Q.defer();

	log('Found ' + screens.length + ' screens.\n');

	for (var i = 0; i < screens.length; i++) {
		log(screens[i]);

		extractScreenText(screens[i])
			.then(checkSpelling)
			.then(function () {
				deferred.resolve();
			})
			.catch(function (err) {
				deferred.reject(err);
			})
	}

	return deferred.promise;
}

var extractScreenText = function (screenPath) {
	var deferred = Q.defer();

	deferred.resolve(['This is a test', 'of the spel checker.']);

	return deferred.promise;
};

var checkSpelling = function (phrases) {
	var deferred = Q.defer();
	var wordPromises = [];

	for (var i = 0; i < phrases.length; i++) {
		var words = phrases[i].split(' ');
		log(words);
		for (var j = 0; j < words.length; j++) {
			wordPromises.push(checkWord(words[j]));
		}
	}

	Q.all(wordPromises)
		.then(function () {
			deferred.resolve();
		});

	return deferred.promise;
};

var checkWord = function (word) {
	var deferred = Q.defer();
	
	dict.spellSuggest(word, function (err, correct) {
		if (err) throw (err);
		if(correct === false) {
			log('    ' + word);
		}
		
		deferred.resolve();
	});
	
	return deferred.promise;
};


if (process.argv.length < 3) {

	log('Invalid WireFrame Sketcher project path.');
	process.exit(1);

} else {
	var wfsProjectPath = process.argv[2];

	log('Scanning ' + wfsProjectPath + '\n');

	initDictionary();
	initParser();
	loadFiles()
		.then(processFiles)
		.then(function () {
			log('Finished');
		})
		.catch(function (err) {
			log('ERROR: ', err);
		})

}

