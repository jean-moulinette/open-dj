module.exports = {

	vlcProcess : null,

	//initialize the VlcApi and wait for instructions
	init : function(){
		
		vlcProcess = require('child_process').spawn('cvlc', ['-I', 'rc', '--novideo'] );
	
		vlcProcess.stdin.setEncoding('utf-8');

	},

	/**
	 *	pause
	 *
	 *	Met en pause VLC
	 *
	 */
	pause : function(args){

		vlcProcess.stdin.write('pause \n');

	},

	volume : function(direction){

		var operator;

		direction == 'up' ? operator = '+' : operator = '-';

		vlcProcess.stdin.write('volume ' + operator + ' 10 \n');

	},

	/**
	 *	play
	 *
	 *	Met en lecture VLC
	 *
	 */
	play : function(args){

		vlcProcess.stdin.write('play \n');

	},

	/**
	 *	nextSound
	 *
	 *	Zap sur la prochaine piste
	 */
	nextSound : function(){

		vlcProcess.stdin.write('next \n');

	},

	/**
	 *	playSound
	 *
	 *	Fonction qui lance la lecture du mp3 par l'API vlc
	 *
	 */
	playsound : function(args){

		vlcProcess.stdin.write('add ' + args.url + ' \n');

	},

	/**
	 *	addToPlayList
	 *
	 *	Ajoute une musique dans la playlist de vlc
	 *
	 */
	addToPlaylist : function(args){
		
		vlcProcess.stdin.write('enqueue ' + args.url + ' \n');

	}

};