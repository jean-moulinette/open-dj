/**
 *	Initialisation des lib du serveur
 */
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	path = require('path'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	io = require('socket.io').listen(server),
	VlcApi = require('./VlcApi.js'),			//API audio pour VLC
	audioTools = require('./audioTools'),		//audioTools lib permettant les interractions musicales sur la machine
	SocketRoutes = require('./SocketsRoutes'),	//SocketRoutes les routes socket io
	routes = require('./routes.js'),			//HTTP routes
	RestRoutes = require('./RestRoutes.js');	//Rest API routes
/**
 * [startServer init open-dj HTTP and websocket server]
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
function startServer(config){

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

	//Shortcut to access playlist object
	serverPlaylist = serverGlobal.playlist;

	app.set('port', config.port || 1337);

	//We add json bodyparser support to our server
	app.use(bodyParser.json());

	//And url encoded body parser
	app.use(bodyParser.urlencoded({extended:true}));

	app.use(require('compression')());

	app.use(methodOverride());

	app.use(express.static('public'));

	app.use(express.static('views/dashboard'));

	app.set('views', __dirname + '/../views');

	app.set('view engine', 'ejs');

	app.set('view options', { layout: false });

	//Initializing my VLC API
	VlcApi.init(io);

	//Initializing regular routes
	routes.initRoutes(app, config);

	//Initializing REST Api routes 
	RestRoutes.initRestApi(app, audioTools, VlcApi);

	//Ouverture des vannes TCP !
	server.listen(app.get('port'), function(){

		//Envoie de l'info de succés de l'opération d'init serveur dans le stdout
		console.log('\nOpen-dj is running on port ' + app.get('port'));

		//Ouverture des vannes sockets
		SocketRoutes.init(io, audioTools, VlcApi);

	});

}

exports.start = function(config){
	startServer(config);
};

