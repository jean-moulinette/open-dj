module.exports = {

	//Gardera le process actif de vlc sur la machine en mémoire
	vlcProcess : null,

	//Module natif nodejs pour lire des lignes dans un stdout/stdin
	stdErrReader : null,

	//Garde le serveur IO en mémoire dans la classe
	io : null,

	/**
	 *	Function init
	 *
	 *	@param [object] - io - Le serveur IO pour communiquer avec les clients si besoin
	 *	@return [undefined]
	 */
	init : function(io){

		this.io = io;

		this.vlcProcess = require('child_process').spawn('cvlc', ['-I', 'rc', '--novideo'] );
		
		this.vlcProcess.stdin.setEncoding('utf-8');

		//Mise en place d'un listener sur la sortie d'erreur de vlc qui sera en pause pour l'instant 
		this.stdErrReader = require('readline').createInterface({
			input:this.vlcProcess.stderr
		});

		//On va lire les lignes dans la sortie d'erreur pour en detecter une
		this.stdErrReader.on('line', this.detectError.bind(this));

	},

	/**
	 *	playSound
	 *
	 *	Fonction qui lance la lecture du mp3 par l'API vlc
	 *
	 */
	playSound : function(args){

		serverGlobal.on = true;

		this.stdErrReader.resume();

		this.vlcProcess.stdin.write('add https://youtube.com/watch?v=' + args.id + ' \n');

	},

	/**
	 *	pause
	 *
	 *	Met en pause VLC
	 *
	 */
	pause : function(args){

		this.vlcProcess.stdin.write('pause \n');

		//Mise à jour de l'objet représentant la lecture de la musique sur le serveur
		serverGlobal.paused = true;

	},

	/**
	 *	play
	 *
	 *	annule la pause dans la lecture de musique de VLC
	 *
	 */
	play : function(args){

		this.vlcProcess.stdin.write('play \n');

		//Mise à jour de l'objet représentant la lecture de la musique sur le serveur
		serverGlobal.paused = false;
	},

	/**
	 *	stop
	 *
	 *	Annule la lecture en cours
	 *
	 */
	stop : function(args){

		this.vlcProcess.stdin.write('stop \n');

		//Mise à jour de l'objet représentant la lecture de la musique sur le serveur
		serverGlobal.on = false;
	},

	/**
	 *	volume
	 *
	 *	Change la direction du volume de + ou - 10 selon le choix selectionné sur le front
	 */
	volume : function(direction){

		var operator;

		direction == 'up' ? operator = '+' : operator = '-';

		this.vlcProcess.stdin.write('volume ' + operator + '10 \n');

	},

	/**
	 *	addToPlayList
	 *
	 *	Ajoute une musique dans la playlist de vlc
	 *
	 */
	addToPlaylist : function(args){
		
		this.vlcProcess.stdin.write('enqueue ' + args.url + ' \n');

	},

	/**
	 *	next
	 *
	 *	Passe à la musique suivante dans la playlist
	 *
	 */
	next : function(args){

		this.vlcProcess.stdin.write('next \n');

	},

	/**
	 *	detectError
	 *
	 *	Cette function est déclenchée en tant que callback de lecteur de ligne dans le stdErr
	 *	Elle va nous servir à detecter le pattern error dans le stderr de VLC
	 *	Lorsqu'on a cette erreur, ça veut dire que la musique est protégée par les ayants droits
	 *	et donc impossible à lire depuis l'exterieur
	 *
	 */
	detectError : function(line){

		if( line.indexOf('lua demux error') > -1 ){

			this.stdErrReader.pause();

			//On repasse la status de la lecture à off
			serverGlobal.on = false;

			this.io.sockets.emit('annoucement', 'Oups !<br/>Impossible de lire cette musique car protégée par les ayants droits.<br/>');

			if( Object.keys(serverPlaylist).length > 0 ){
				this.next();
			}

			setTimeout(function(){
				this.stdErrReader.resume();
			}.bind(this), 1000);

		}

	}

};