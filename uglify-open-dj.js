var UglifyJS = require('uglify-js');
var fs = require('fs');

var result = UglifyJS.minify(["public/js/YoutubePlayer.js", "public/js/SocketsManager.js"], {
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

fs.writeFileSync('./public/js/Build/open.dj.min.js', result.code);