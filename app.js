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
		░░░░░░░░░░░░░ ▲ ░░░░░░░░░░░░
		░░░░░░░░░░░░ ▲ ▲ ░░░░░░░░░░░
		░░░░░░░░░░░ ▲ ▲ ▲ ░░░░░░░░░░
		░░░░░░░░░░ ▲ ▲ ▲ ▲ ░░░░░░░░░
		░░░░░░░░░ ▲ ▲ ▲ ▲ ▲ ░░░░░░░░
		░░░░░░░░ ▲ ▲ ▲ ▲ ▲ ▲ ░░░░░░░
		░░░░░░░ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ░░░░░░
		░░░░░░ ▲░░░░░░░░░░░░▲ ░░░░░░
		░░░░░ ▲ ▲░░░░░░░░░░▲ ▲ ░░░░░
		░░░░ ▲ ▲ ▲░░░░░░░░▲ ▲ ▲ ░░░░
		░░░ ▲ ▲ ▲ ▲░░░░░░▲ ▲ ▲ ▲ ░░░
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
	methodOverride = require('method-override'),
	io = require('socket.io').listen(server),
	audioTools = require('./lib/audioTools'),	//audioTools lib permettant les interractions musicales sur la machine
	socketsRoutes = require('./lib/socketsRoutes');	//socketsRoutes les routes socket io

process.title = 'open-dj';

app.set('port', process.env.TEST_PORT || 1337);

app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

//Routes
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

//Route de telechargement d'une musique
app.get('/download', function(req, res){
	audioTools.resolveDownload(req, res);
});

/**
 *	Objet global au serveur qui sera nourri lors des lectures de musiques
 *
 *	on - { boolean } - true si une lecture est en cours
 *	managing - { boolean } - true si le serveur est en train de traiter une demande
 *	musicTitle - { string } - Titre de la musique en cours
 *	image - { string } - URL de l'image representant la musique
 *	paused - { boolean } - true si la musique est en pause
 *	process - { Child Process } - Le child process de lecture de la musique
 *	playlist - { object } - Objet contenant les videos en fil d'attente de lecture
 */
playingStatus = {

	on:false,

	downloading:false,

	songId:null,

	musicTitle:'',

	image:'',

	paused:false,

	process:null,

	playlist:{}

};

//Alias pour la playlist
serverPlaylist = playingStatus.playlist;

//Ouverture des vannes TCP !
server.listen(app.get('port'), function(){

	//Envoie de l'info de succés de l'opération d'init serveur dans le stdout
	console.log('\nOpen-dj is running on port ' + app.get('port'));

	//Ouverture des vannes sockets
	socketsRoutes.init(io, audioTools);

});
