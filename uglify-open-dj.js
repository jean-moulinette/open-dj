var fs = require('fs');

/**
 * JS
 */
var UglifyJS = require('uglify-js');

var resultJS = UglifyJS.minify(["public/js/YoutubePlayer.js", "public/js/SocketsManager.js"], {
	mangle: true,
	compress: {
		sequences: true,
		dead_code: true,
		conditionals: true,
		booleans: true,
		unused: true,
		if_return: true,
		join_vars: true,
		drop_console: true
	}
});
console.log('\nUglyfied JS : :');
console.log('\n');

console.log(resultJS.code);

var jsPath = './public/js/Build/open.dj.min.js';

fs.writeFileSync(jsPath, resultJS.code);

console.log('\nSauvegarde réussie. ' + jsPath);

/**
 * CSS
 */
var uglifycss = require('uglifycss');

var uglified = uglifycss.processFiles(
    [ './public/css/open-dj.css'],
    { maxLineLen: 500, expandVars: true }
);

var cssPath = './public/css/Build/open-dj.min.css';

fs.writeFileSync(cssPath, uglified);

console.log('\n\n');
console.log('Uglyfied CSS : :');
console.log('\n');
console.log(uglified);

console.log('\n\nSauvegarde réussie. ' + cssPath+'\n');