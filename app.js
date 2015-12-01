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
	VlcApi = require('./lib/VlcApi.js'),		//API audio pour VLC
	audioTools = require('./lib/audioTools'),		//audioTools lib permettant les interractions musicales sur la machine
	SocketRoutes = require('./lib/SocketsRoutes'),	//SocketRoutes les routes socket io
	config = require('./open-dj.conf.js');

//Gestion oublis de configuration
if( config.host === ''){
	throw '\nYou must edit the file "open-dj.conf.js" with your server\'s ip to get open-dj working \n';
} 

/**
 *	Objet global au serveur qui sera nourri lors des lectures de musiques
 *
 *	VlcApi - { object } - Module maison pour controler VLC sur la machine
 *	on - { boolean } - true si une lecture est en cours
 *	managing - { boolean } - true si le serveur est en train de traiter une demande
 *	musicTitle - { string } - Titre de la musique en cours
 *	image - { string } - URL de l'image representant la musique
 *	paused - { boolean } - true si la musique est en pause
 *	process - { Child Process } - Le child process de lecture de la musique
 *	playlist - { object } - Objet contenant les videos en fil d'attente de lecture
 */
serverGlobal = {

	VlcApi:VlcApi,

	on:false,

	downloading:false,

	songId:null,

	musicTitle:'',

	image:'',

	paused:false,

	process:null,

	//Contiendra chaques videos ajoutées dans la playlist,
	// sera utile si je souhaite les interfacer un jour
	playlist:{},

	host:config.host,

	port:config.port

};

process.title = 'open-dj';

app.set('port', config.port || 1337);

app.use(require('compression')());

app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', __dirname + '/views');

app.set('view engine', 'ejs');

app.set('view options', { layout: false });

//Routes
app.get('/', function (req, res) {
	
	//On injecte la valeur du volume Vlc dans l'attribut volume de l'objet param pour ejs
	config.volume = VlcApi.volumePercentVal;

	res.render('index.ejs', config);

});

//Route de telechargement d'une musique (DEPRECATED)
app.get('/download', audioTools.resolveDownload);


//Alias pour la playlist
serverPlaylist = serverGlobal.playlist;

//Ouverture des vannes TCP !
server.listen(app.get('port'), function(){

	//Envoie de l'info de succés de l'opération d'init serveur dans le stdout
	console.log('\nOpen-dj is running on port ' + app.get('port'));

	//Ouverture des vannes sockets
	SocketRoutes.init(io, audioTools, VlcApi);

});
