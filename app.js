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
	audioTools = require('./lib/audioTools');

app.set('port', process.env.TEST_PORT || 1337);

app.use(logger({path:'dev'}));

app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'public')));


//Routes
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

//Route de telechargement d'une musique
app.get('/download', function(req, res){

	//Envoi du fichier au client (path + fileName)
	res.download('downloaded/' + playingStatus.songId, playingStatus.musicTitle+'.mp3', function(err){

		//Log des erreurs
		if(err){
			console.log(err);
			res.status(err.status).end();
		}else{
			//Log de succés avec nom du fichier
			console.log('Un client vient de télécharger le fichier ' + playingStatus.songId + ' :' + playingStatus.musicTitle);
		}

	});

});

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

	downloading:false,

	songId:null,

	musicTitle:'',

	paused:false,

	process:null

};

/**
 *	Initialisation du serveur IO
 *
 *	Attachement des event listeners sur les connexions sockets
 *
 *	Event : Connection @return : { Obj } socket 
 *	[L'objet représentant une connection bidirectionnelle établie entre la machine cliente et le serveur node.]
 *
 **/
io.sockets.on('connection', function(socket){

	//Commande IO init de la connection bidrectionelle avec le client
	socket.on('new_user', function(data){

		console.log('\n Un visiteur vient de se connecter.\n');
		socket.patternSearched = null;

		//Si une musique est déjà en cours
		if(playingStatus.on){

			//On indique le titre au nouveau client
			socket.emit('update-current-music', playingStatus.musicTitle);

		}else if(playingStatus.downloading){//Si aucune musique n'est en cours mais que le serveur est en train de traiter une demande

			//On lui colle un overlay avec un titre de musique indiquant le téléchargement en cours
			socket.emit('update-current-music', 'downloading');			

		}

	});

	//Commande IO de recherche sur youtube
	socket.on('yt-search', function(data){

		//Remise à zero de l'espion de recherche
		socket.patternSearched = null;

		console.log('\n Un client cherche une vidéo. \n');

		//Envoi des résultats de la recherche au client par le serveur
		audioTools.searchVideo(data, socket);

	});

	socket.on('result-page-change', function(data){

		console.log('data dans result-page-change + pattern:');
		console.log('data: '+data+' pattern: '+socket.patternSearched);

		//Envoi d'une nouvelle requette avec data comme pour numéro de page de résulrat
		//On récupere socket.patternSearched qui à pris sa valeur dans audioTools.searchVideo lors de la première recherche
		audioTools.searchVideo(socket.patternSearched+'&page='+data, socket);

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
		if(!playingStatus.downloading){

			//On indique que le serveur est en train de traiter une demande
			playingStatus.downloading = true;

			//Le serveur prends la vidéo et fait le necessaires pour la lire
			audioTools.audioExist(data, io.sockets, false);

		}

	});

	//Commande IO de changement de musique en cours
	socket.on('forceChange', function(data){

		console.log('Un client souhaite forcer le changement d\'une musique en cours de lecture');

		//On indique que le serveur est en train de traiter une demande
		playingStatus.downloading = true;

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

	//Event listener de téléchargement d'une musique en cours de lecture
	socket.on('music-download', function(){

		console.log('Un client demande le téléchargement d\'une musique');
		
		//Si aucune musique en cours de lecture, on fait péter un message d'erreur
		if(!playingStatus.on){
		
			socket.emit('annoucement', 'Aucune musique n\'est en cours de lecture.');
		
			return;

		}else{

			//On renvoi au SocketManager chez le client, la route serveur et l'id du fichier à télécharger
			socket.emit('song-download-accepted');

		}

	
	});

	socket.on('ask-server', function(){

		console.log('playingStatus :\n');

		console.log('on :'+playingStatus.on+'\n');
		console.log('downloading :'+playingStatus.downloading+'\n');
		console.log('musicTitle :'+playingStatus.musicTitle+'\n');
		console.log('paused :'+playingStatus.paused+'\n');
		console.log('songId :'+playingStatus.songId+'\n');

	});

});

//Ouverture des vannes TCP !
server.listen(app.get('port'), function(){

  console.log('\nOpen-dj is running on port ' + app.get('port'));

});
