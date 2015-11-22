module.exports = {

	//Gardera le process actif de vlc sur la machine en mémoire
	vlcProcess : null,

	//Lecteur stdErr
	stdErrReader : null,

	//Pareil pour la sortie standart
	volumeStdoutReader : null,

	//Garde le serveur IO en mémoire dans la classe
	io : null,

	//Module natif nodejs pour lire des lignes dans un stream
	readLine : require('readline'),

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
		this.stdErrReader = this.readLine.createInterface({
			input:this.vlcProcess.stderr
		});

		//Ouverture du lecteur de stream sur le stdout
		this.volumeStdoutReader = this.readLine.createInterface({
			input:this.vlcProcess.stdout
		});

		//On va lire les lignes dans la sortie d'erreur pour en detecter une
		this.stdErrReader.on('line', this.detectError.bind(this));

		//On attache sendVOlumePercent() sur l'event line du stream stdout
		this.volumeStdoutReader.on('line', this.sendVolumePercent.bind(this));

		//On définis de base le volume à 100% lors de l'init
		this.vlcProcess.stdin.write('volume 256 \n');
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

		//Obligé d'avoir ce timeout sinon l'interface de vlc renvoi des données érronées sur la valeur du volume
		setTimeout(function(){
	
			//On va demander à vlc la valeur de son volume actuel
			this.vlcProcess.stdin.write('volume \n');
				
		}.bind(this), 850);

	},

	/**
	 *	sendVolumePercent
	 *
	 *	Lis la valeur volume de Vlc et la transforme en pourcentage pour la renvoyer aux utilisateurs 
	 *
	 */
	sendVolumePercent : function(line){
		
		var result, valueToCompute;

		//On va appliquer deux regex pour nettoyer le resultat de caractère non numériques		
		line = line.replace(/>/g, '');

		line = line.replace(/ /g, '');

		//Si au parseInt on est bien en présence d'une valeur numérique
		if( !isNaN(parseInt(line)) ){

			valueToCompute = (parseInt(line));

			//Avec un produit en croix, on peut deviner la valeur en pourcentage du volume sachant que 256 = 100%
			result = Math.round( ( valueToCompute * 100 ) / 256 );
			
			//Envoi à tous les sockets de la nouvelle valeur du volume à afficher sur leur front
			this.io.sockets.emit('volume-value', result);

		}

	},

	/**
	 *	addToPlayList
	 *
	 *	Ajoute une musique dans la playlist de vlc
	 *
	 */
	addToPlaylist : function(args){
		this.vlcProcess.stdin.write('enqueue https://www.youtube.com/watch?v=' + args.id + ' \n');

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