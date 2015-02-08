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
	path = require('path');
	logger = require('express-logger'),
	methodOverride = require('method-override'),
	io = require('socket.io').listen(server),
	spawn = require('child_process').spawn,
	omx = require('omxcontrol'),
	playing = false;

app.set('port', process.env.TEST_PORT || 8080);

app.use(logger({path:'dev'}));

app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

//Module de controle de omxplayer, créé des route start/:filename pause quit 
app.use(omx());


//Routes
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

app.get('/remote', function (req, res) {
  res.sendfile(__dirname + '/public/remote.html');
});


var ss;

//Le serveur socket.io
io.sockets.on('connection', function(socket){
	
	//Socket screen
	socket.on('screen', function(data){
		
		socket.type = 'screen';

		//Garde en mémoire le socket screen
		ss = socket;
		console.log('\n Client de recherche de vidéos viens de se connecter.\n');
	});

	socket.on('yt-search', function(data){
		
		console.log('\n Un client cherche une vidéo. \n');

		data = data.toLowerCase();

		data = data.replace(/ /g, '+');

		var requestTool = require('follow-redirects').http;

		var hostName = 'youtube.com';

		var requestOptions = {
			host: hostName,
			path:'/results?search_query='+data,
			port:'80'
		};

		var req = requestTool.request(requestOptions, function(requestResponse){

			var htmlResponse = '';
			
			var htmlNinja = '';

			requestResponse.setEncoding('utf8');

			requestResponse.on('data', function(chunk){
				htmlResponse += chunk;
			});

			requestResponse.on('end', function(){

				var env = require('jsdom').env;

				env(htmlResponse, function(errors, window){
					
					if(errors !== null){
						console.log(errors);
					}

					var $ = require('jquery')(window);
					
					var stylesNinja = '';

					$('#results').find('.yt-lockup').each(function(){

						$(this).find('button').each(function(){
							$(this).remove();
						});

						var linkImage = $(this).find('.yt-lockup-thumbnail').html();
						var title = $(this).find('.yt-lockup-content').find('a').html();
						
						var singleResult = linkImage+title+'<br/><br/><br/>';

						htmlNinja += singleResult;
					});

					socket.emit('yt-result', htmlNinja);

				});

			});

		});

		req.end();
	
	});

	socket.on('video', function(data){

		var child;
		var audioTools = require('./lib/audioTools');
		var soundName = data.id+'.mp3';
		
		console.log('\n\n*****************************');
		console.log('*****************************');
		console.log('Demande de lecture reçue par le client\n');

		console.log('Playing :'+playing);

		var checkIfExist = audioTools.audioExist(data);

		if(checkIfExist){
			console.log('\nCe fichier MP3 existe déjà sur le serveur.\n');
			audioTools.faitPeterLeSon(soundName);
		}else{
			console.log('\nLe fichier n\'a pas été trouvé sur le serveur, téléchargement lancé...\n');
			audioTools.downloadVideo(data);
			audioTools.faitPeterLeSon(soundName);
		}

		console.log('*****************************');
		console.log('*****************************');
		console.log('Traitement de la demande de lecture terminé.');

	});



});

server.listen(app.get('port'), function(){

  console.log('Express server listening on port ' + app.get('port'));

});
