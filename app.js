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

//Objet global au serveur qui sera nourri lors des lectures de musiques
playingStatus = {
	on:false,
	musicTitle:''
};



//Le serveur socket.io
io.sockets.on('connection', function(socket){
	
	//Commande IO init de la connection bidrectionelle avec le client
	socket.on('new_user', function(data){
		
		console.log('\n Un visiteur vient de se connecter.\n');
		socket.type = 'new_user';

		//Si une musique est déjà en cours
		if(playingStatus.on){

			//On va envoyer un event au nouveau client pour qu'il voit le titre de la musique actuelle
			socket.emit('update-current-music', playingStatus.title);

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

		//Le serveur prends la vidéo et fait le necessaires pour la lire
		audioTools.audioExist(data, io.sockets);

	});

	//Commande IO de réglage du volume de diffusion de la musique
	socket.on('modifyVolume', function(choice){
		audioTools.modifyVolume(choice);
	});

});

//Ouverture des vannes TCP !
server.listen(app.get('port'), function(){

  console.log('Express server listening on port ' + app.get('port'));

});
