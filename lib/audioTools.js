/**
 *	Declaration des variables/modules utiles au script(fork ou main)
 *
 *	child : main - Permet de forker le process pour lancer les traitement lourds (telechargement/lecture musique)
 *			forked - Permet de lancer les exec bash
 *
 *	fs : main only - Permet de parcourir les fichier téléchargés pour vérifier si un son n'est pas deja présent sur le serveur
 *
 *	playingProcess : main only - Contient le child process forked - Fera la lecture/telechargement des musiques 		
 */

var child = require('child_process');

//Appel d'audioTools avec arguments via un processus enfant au main
if(process.argv[2] === 'searchYoutube'){
	
	//Commande de recherche d'un pattern sur youtube pour ramener le DOM chez le client

	//Appel du module de requete
	var requestTool = require('follow-redirects').http;

	//Lancement de la requête avec un evenement d'envoi de Message au process en fin 
	searchYoutube(process.argv[3]);

}else if(process.argv[2] === 'downloadMp3'){

	//Demande de téléchargement + lecture

	console.log('\nTéléchargement du MP3\n');

	//Création de l'url de tléchargement via l'identifiant envoyé au fork du process
	var url = 'http://www.youtube.com/watch?v='+process.argv[3];

	/**
	 *	Va dans le dossier 'downloaded',
	 *	execute youtube-dl options o pour renommer le fichier %(id)s pour l'id de la video et le format %(ext)s
	 *	extract audio pour recup juste le son et audio format réglé mp3
	 *	skip dash manifest et no check certificate pour outrepasser des vérifs 
	 *	no-part pour ne pas créer un fichier .part temporaire sur le serveur
	 */
	var downloadCommand = 'cd downloaded && youtube-dl -w -o "%(id)s.%(ext)s" --youtube-skip-dash-manifest  --no-check-certificate --extract-audio --audio-format mp3 --no-part "'+url+'" > log_dl.log && sleep 1';

	//Envoi de l'information de démarrage du téléchargement au processus parent qui mettra un overlay d'attente chez les clients
	process.send({
		task:'download-start'
	});

	//Execute le shell de téléchargement/conversion mp3 de la video youtube
	child.exec(downloadCommand, function(){

		//Envoi de l'information de fin du téléchargement au processus parent qui enlevera l"overlay d'attente chez les clients
		process.send({
			task:'download-over'
		});

		playSound(process.argv[3]+'.mp3');

	});

}

//Appel de audioTools sans arguments, init normal avec exportation de function publiques
if(typeof process.argv[2] == 'undefined'){

	var fs = require('fs');
	
	//Module de nettoyeur de chaine de caractères incompatible pour des URL
	var diacritics = require('diacritics');
	
	var forkedProcess;

	//Export des fonctions publiques
	module.exports = {

		/**
		 *	searchVideo
		 *	
		 *	Fais une request sur youtube pour ramener les resultats
		 *	chez le nav client
		 *
		 *	@param: req - {object} - L'objet requête de la route
		 *	@param: res - {object} - L'objet reponse de la route
		 *
		 *	@return undefined
		 */
		searchVideo : function(req, res){

			var data = diacritics.remove(req.params.searchPattern + '&page=' + req.params.pageNumber);

			//Fork du process pour liberer le serveur express
			var requestWorker = child.fork('./lib/audioTools.js', ['searchYoutube', data]);

			requestWorker.on('message', function(retour){
				requestWorker.kill();
				res.send(JSON.stringify(retour));
			});

		},

		/**
		 *	modifyVolume
		 *	
		 *	Execute un shell pour baisser/augmenter le volume de 5%
		 *	via le gestionnaire de son alsa
		 *
		 *	DEPRECATED 
		 *	Conviens à une utilisation avec 'youtube-downloader'
		 *
		 *	@param: choice - {string} - up ou down
		 *
		 *	@return: void
		 */
		modifyVolume : function(choice){

			if(choice === 'up'){
				child.exec('amixer set Master 5%+');
			}else if(choice === 'down'){
				child.exec('amixer set Master 5%-');
			}

		},

		/**
		 * [resolveDownload Permet le téléchargement de la musique par le client]
		 * 
		 * @param  {[object]} req [request d'express]
		 * @param  {[object]} res [response d'express]
		 * 
		 * @return {[undefined]}     [Renvoi la réponse des binaires au client via la méthode download de l'objet réponse]
		 */
		resolveDownload : function(req, res){

			//Envoi du fichier au client (path + fileName)
			res.download('downloaded/' + serverGlobal.songId, serverGlobal.musicTitle+'.mp3', function(err){

				//Log des erreurs
				if(err){
					console.log(err);
					res.status(err.status).end();
				}else{
					//Log de succés avec nom du fichier
					console.log('Un client vient de télécharger le fichier ' + serverGlobal.songId + ' :' + serverGlobal.musicTitle);
				}

			});

		}

	};


}

/**
 *	playSound
 *
 *	Fonction qui lance la lecture du mp3 sur la machine serveur via l'utilitaire mplayer
 *
 *	DEPRECATED 
 *	Conviens à une utilisation avec 'youtube-downloader'
 *
 *	@param: {[string]}	- fileName - Le nom du fichier mp3 à lancer sur la machine
 */
function playSound(fileName){

	//Lancement du child de lecture de la musique
	var playingProcess = child.exec('cd downloaded && mplayer -- ' + fileName + ' > log_play.log');

	playingProcess.stdin.setEncoding = 'utf-8';

	/**
	 *	La gestion des messages provenant du process parent
	 *
	 *	Correspond au control de déroulé de la musique par les clients
	 *
	 *	Commandes : Pause/remuse 
	 */
	process.on('message', function(parentMessage){

		//En fait c'est la même commande stdin dans mplayer pour pauser/reprendre la lecture 
		if(parentMessage.command === 'pause' || parentMessage.command === 'resume'){
			playingProcess.stdin.write('p');
		}

	});

	//Gestion de la mort du process de lecture (Quand la musique est finie)
	playingProcess.on('exit', function(){

		//log serveur
		console.log('\nMusique terminée\n');

		process.send({
			task:'music-finished'
		});

	});

	//Envoi du titre de la musique au process parent pour qu'il puisse le mettre dans le 'playing now' de tous les clients sockets
	process.send({

		task:'update-music',
		
		songId:fileName,
		
		//Le process appelant enverra toujours le titre de la musique en 4eme argument et l'enfant le lui renvoi une fois l'opération accomplie
		title:process.argv[4],

		image:process.argv[5]
	
	});

}

/**
 *	searchYoutube
 *
 *	Lance la requete sur youtube pour ramener des choix de vidéos
 *
 *	 @param: { string } - data - Le pattern de recherche du client
 */
function searchYoutube(data){

	var hostName = 'youtube.com';
	var urlPath = '/results?filters=video&lclk=video&search_query='+data;

	var requestOptions = {
		hostname: hostName,
		path: urlPath,
		port: '80',
		headers: {
			'Accept-Charset':'utf-8',
		}
	};
	
	var req = requestTool.request(requestOptions, function(requestResponse){

		var htmlResponse = '';

		requestResponse.setEncoding('utf8');

		requestResponse.on('data', function(chunk){
			htmlResponse += chunk;
		});

		requestResponse.on('end', function(){
			//Envoi de la donnée recupérée au process parent
			process.send({
				result : htmlResponse,
				pattern : data
			});
		});

	});

	req.end();

}
