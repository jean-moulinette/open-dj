/**
 **************************************
 *	@author: Jean Baptiste Priam Massat
 *			 Aka Fanghornn
 *			 
 * 	@mail: jean.massat[at]gmail[dot]com
 *
 * 	@Project: A simple personnal DIY node.js server which aim to make your local speakers accessible from web clients.
 *
 *	@Copyright (c) <2014> <Jean Baptiste PRIAM MASSAT>
 * 
 * 	@if you are reading this: You are an idiot. 
 *
 ************************************** 
 */

/*
	░░░░░░░░░░░░░ ▲ ░░░░░░░░░░░░░░░░░░░
	░░░░░░░░░░░░ ▲ ▲ ░░░░░░░░░░░░░░░░░
	░░░░░░░░░░░ ▲ ▲ ▲ ░░░░░░░░░░░░░░░
	░░░░░░░░░░ ▲ ▲ ▲ ▲ ░░░░░░░░░░░░░░
	░░░░░░░░░ ▲ ▲ ▲ ▲ ▲ ░░░░░░░░░░░░
	░░░░░░░░ ▲ ▲ ▲ ▲ ▲ ▲ ░░░░░░░░░░
	░░░░░░░ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ░░░░░░░░
	░░░░░░ ▲░░░░░░░░░░░░▲ ░░░░░░░░
	░░░░░ ▲ ▲░░░░░░░░░░▲ ▲ ░░░░░░░
	░░░░ ▲ ▲ ▲░░░░░░░░▲ ▲ ▲ ░░░░░
	░░░ ▲ ▲ ▲ ▲░░░░░░▲ ▲ ▲ ▲ ░░░░
	░░ ▲ ▲ ▲ ▲ ▲░░░░▲ ▲ ▲ ▲ ▲ ░░
	░ ▲ ▲ ▲ ▲ ▲ ▲░░▲ ▲ ▲ ▲ ▲ ▲ ░
	 ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
		░░░░░▓▓░░░░░░░░░░░░▓▓░░░░░░░
		░░░░░▓▓▓░████████░▓▓▓░░░░░░░
		░░░░░▓▓░█▓▓▓▓▓▓▓▓█░▓▓░░░░░░░
		░░░░░▓▓░░░██░░██░░░▓▓░░░░░░░		
		░░░░░▓▓░░░▓▓░░▓▓░░░▓▓░░░░░░░			La triforce vaincra !
		░░░░░▓▓▓░░░░░░░░░░▓▓▓░░░░░░░		
		░░░░░▓▓▓██░░▓▓░░██▓▓▓░░░░░░░
		░░░░░░▓▓███░▓▓░███▓▓░░░░░░░░
		░░░░░░▓████████████▓░░░░░░░░
		░░░░░░░████████████░░░░░░░░░
		░░░░░░░████████████░░░░░░░░░
		░░░░░░░████▓▓▓▓████░░░░░░░░░
		░░░░░░░▓▓▓▓▓██▓▓▓▓▓░░░░░░░░░
		░░░░░░░████▓▓▓▓████░░░░░░░░░
		░░░░░░░████████████░░░░░░░░░
		░░░░░░░░▓▓▓░░░░▓▓▓░░░░░░░░░░
		░░░░░░░░▓▓▓░░░░▓▓▓░░░░░░░░░░
*/

/**
 *	Initialisation des lib du serveur
 */
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	path = require('path'),
	logger = require('express-logger'),
	methodOverride = require('method-override'),
	io = require('socket.io').listen(server),
	audioTools = require('./lib/audioTools'),
	clients =  {};

app.set('port', process.env.TEST_PORT || 1337);

app.use(logger({path:'dev'}));

app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'public')));


//Routes
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

app.get('/remote', function (req, res) {
  res.sendfile(__dirname + '/public/remote.html');
});


var ss;

/**
 *	Objet global au serveur qui sera nourri lors des lectures de musiques
 *
 *	on - { boolean } - true si une lecture est en cours
 *	managing - { boolean } - true si le serveur est en train de traiter une demande
 *	musicTitle - { string } - Titre de la musique en cours
 *	paused - { boolean } - true si la musique est en pause
 *	process - { Child Process } - Le child process de lecture de la musique
 */
playingStatus = {
	on:false,
	managing:false,
	musicTitle:'',
	paused:false,
	process:null
};

//Le serveur socket.io
io.sockets.on('connection', function(socket){

	//Commande IO init de la connection bidrectionelle avec le client
	socket.on('new_user', function(data){

		console.log('\n Un visiteur vient de se connecter.\n');
		socket.type = 'new_user';

		//Si une musique est déjà en cours ou que le serveur est en train de traiter une demande
		if(playingStatus.on || playingStatus.managing){

			//Si le serveur est en train de télécharger une musique
			if(playingStatus.managing){
				//On lui colle(au client) l'overlay dans la tête via un event socket
				socket.emit('update-current-music', 'downloading');
			}else{
				//Sinon, on va envoyer un event au nouveau client pour qu'il voit le titre de la musique actuelle
				socket.emit('update-current-music', playingStatus.title);
			}

		}

		//Garde en mémoire le socket screen
		ss = socket;

	});

	//Commande IO de recherche sur youtube
	socket.on('yt-search', function(data){

		console.log('\n Un client cherche une vidéo. \n');

		//Envoi des résultats de la recherche au client par le serveur
		audioTools.searchVideo(data, socket);

	});

	//Commande IO de récéption d'une requête vidéo spécifique youtube à lire
	socket.on('video', function(data){

		console.log('\n\n*****************************');
		console.log('*****************************');
		console.log('Demande de lecture reçue par le client\n');

		//Si une musique est déjà en cours de lecture
		if(playingStatus.on){

			//On va envoyer une notification au socket pour savoir si il veut kick le son en cours
			socket.emit('ask-force', data);

			//On sort de la fonction sinon ça va lancer le son en double..
			return;

		}

		//Si le serveur n'est pas déjà en train de traiter une demande
		if(!playingStatus.managing){

			//On indique que le serveur est en train de traiter une demande
			playingStatus.managing = true;

			//Le serveur prends la vidéo et fait le necessaires pour la lire
			audioTools.audioExist(data, io.sockets, false);

		}

	});

	//Commande IO de changement de musique en cours
	socket.on('forceChange', function(data){

		console.log('Un client souhaite forcer le changement d\'une musique en cours de lecture');

		//On indique que le serveur est en train de traiter une demande
		playingStatus.managing = true;

		//Le serveur prends la vidéo et fait le necessaires pour la lire
		audioTools.audioExist(data, io.sockets, true);	
	
	});

	//Commande IO de réglage du volume de diffusion de la musique
	socket.on('modifyVolume', function(choice){

		if(!playingStatus.on){

			socket.emit('annoucement', 'Aucune musique n\'est en cours de lecture.');

			return;
		}

		audioTools.modifyVolume(choice);
	
	});

	//Commande IO de mise en pause de la lecture
	socket.on('pause', function(data){

		if(!playingStatus.on){

			socket.emit('annoucement', 'Aucune musique n\'est en cours de lecture.');

			return;
		}

		//Si le lecteur du serveur n'est pas deja en pause, on peut continuer
		if(!playingStatus.paused){

			var messageObject = {
				command:'pause'
			};

			//Envoi de la commande de pause au child process
			playingStatus.process.send(messageObject);

			//Mise à jour de l'objet représentant la lecture de la musique sur le serveur
			playingStatus.paused = true;			
		}

	});

	//Commande IO de remise en marche de la lecture
	socket.on('resume', function(data){

		if(!playingStatus.on){

			socket.emit('annoucement', 'Aucune musique n\'est en cours de lecture.');

			return;
		}

		//Si le lecteur du serveur est en pause
		if(playingStatus.paused){

			var messageObject = {
				command:'resume'
			};

			//Envoi de la commande de remise en marche du lecteur serveur
			playingStatus.process.send(messageObject);

			//Mise à jour de l'objet représentant la lecture de la musique sur le serveur
			playingStatus.paused = false;

		}

	});

	socket.on('ask-server', function(){
		
		console.log('playingStatus :\n');

		console.log('on :'+playingStatus.on+'\n');
		console.log('managing :'+playingStatus.managing+'\n');
		console.log('musicTitle :'+playingStatus.musicTitle+'\n');
		console.log('paused :'+playingStatus.paused+'\n');

	});

});

//Ouverture des vannes TCP !
server.listen(app.get('port'), function(){

  console.log('Express server listening on port ' + app.get('port'));

});
