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

//Demande de lecture directe
if(process.argv[2] === 'playSound'){

	playSound(process.argv[3]+'.mp3');

}


//Appel de audioTools sans arguments, init normal avec exportation de function publiques
if(typeof process.argv[2] == 'undefined'){

	var fs = require('fs');

	var forkedProcess;

	//Export des fonctions publiques
	module.exports = {

		/**
		 *	audioExist
		 *	
		 *	Va verifier que la vidéo n'a pas déjà été téléchargée, puis va lancer la lecture dans un forked child
		 *
		 *	 @param: { object } - data - Un objet contenent l'id de la video + titre 
		 *			 { object } - sockets - L'objet socket représantant tous les clients connectés (Permettra de leur mettre à jour le titre de la musique en cours)
		 			 { boolean } - force - Indique si le serveur doit forcer le changement d'une musique en cours
		 *	
		 *	@return - result - { boolean } - Si oui retourne true sinon false
		 */
		audioExist : function(data, sockets, force){
			
			console.log('\nLa verification de la presence du fichier sur le serveur commence.\n');

			//La resultat qui sera retourné
			var result = false;

			fs.readdir('./downloaded', function(err, files){

				var dirLength = files.length;
				
				var result = false;

				//a chaque itteration on regarde si notre fichier correspond à l'id qu'on veut telecharger
				for(var i = 0; i < dirLength; i++){

					//Si ça match on return true pour juste executer le lecteur dessus plus tard au lieu de retelecharger la data
					if(files[i] === data.id+'.mp3'){ result = true; }

				}

				//Si on l'a, on lance la lecture
				if(result){

					//Si on est en mode forcing, il va falloir faire quelques opérations en plus 
					if(force){

						console.log('\nChangement forcé de piste\n');
						
						//On kill l'ancien processus qui était en train de lire la musique
						playingStatus.process.kill();

						//Il dégage de la mémoire
						playingStatus.process = null;
						
						//Mise à jour de playingStatus
						playingStatus.on = false;
					}

					//Fork du process main pour lire la piste audio sur le serveur
					forkedProcess = child.fork('./lib/audioTools.js', ['playSound', data.id, data.title, data.image]);

				}else{
					//Fork du process main pour télécharger le fichier mp3
					forkedProcess = child.fork('./lib/audioTools.js', ['downloadMp3', data.id, data.title, data.image]);
				}

				//Ici on va gérrer les differentes étapes de vie du child de lecture de la musique
				forkedProcess.on('message', function(data){

					//Ici le child viens de lancer la lecture avec succés et retourne le titre du son
					if(data.task === 'update-music'){

						//Si on a plus de 45 caractères dans le titre, on va le raccourcir
						if(data.title.length > 45){
							data.title = data.title.slice(0, 45)+'...';
						}

						//Il va nous renvoyer le titre de la musique qu'on va renvoyer à tous les clients connectés
						sockets.emit('update-current-music', data.title);

						//Mise à jour de l'objet global représant la musique en cours de lecture
						playingStatus.on = true;
						playingStatus.musicTitle = data.title;
						playingStatus.downloading = false;
						//Récupération de l'id de la video
						playingStatus.songId = data.songId;
						playingStatus.image = data.image;

						//On met le child process de lecture dans la propriété 'process' il pourra être récupéré plus tard
						playingStatus.process = forkedProcess;

					}//Ici le child viens de finir de lire sa musique et l'exec viens de mourir 
					else if(data.task === 'music-finished'){

						playingStatus.on = false;
						playingStatus.musicTitle = 'En attente...';

						//Mise à jour de l'afficheur de titre chez les clients
						sockets.emit('update-current-music', 'En attente...');

					}//Ici le processus forké nous informe qu'un telechargement est en cours
					else if(data.task === 'download-start'){

						//Envoi d'une commande io pour que les clients soit en attente
						sockets.emit(data.task);

						console.log('Le process enfant commence le dl \n');

					}//ici le processus forké nous informe que le téléchargement est terminé
					else if(data.task === 'download-over'){

						//Si on est en mode force changement de musique en cours, on va tuer la musique précédante juste avant de lancer la nouvelle
						if(force){

							//On kill l'ancien processus qui était en train de lire la musique
							playingStatus.process.kill();

							//Il dégage de la mémoire
							playingStatus.process = null;
							
							//Mise à jour de playingStatus
							playingStatus.on = false;
					
						}

						//Envoi d'une commande IO pour que les clients ne soient plus en attente
						sockets.emit(data.task);

					}

				});

				//Gestion de la mort du forkedprocess
				forkedProcess.on('close', function(code, signal){

					console.log('\nLe child de lecture viens de mourir\n');

					console.log('Code: ' + code + '\n');
					console.log('Signal: ' + signal + '\n');

				});

			});

		},

		/**
		 *	searchVideo
		 *	
		 *	Fais une request sur youtube pour ramener les resultats
		 *	chez le nav client
		 *
		 *	@param: data - {string} - La chaine envoyé par le client
		 *	@param: socket - {socket} - Le socket du client
		 *
		 *	@return void
		 */
		searchVideo : function(data, socket){

			//Fork du process pour liberer le serveur express
			var requestWorker = child.fork('./lib/audioTools.js', ['searchYoutube', data]);

			requestWorker.on('message', function(retour){

				//Si l'espion de recherche est à null, on va le mettre à jour
				if(socket.patternSearched === null){

					//On met en mémoire le pattern de recherche du client unique dans son propre socket
					//Sera récupéré dans l'event "result-page-change" du serveur socketio 
					socket.patternSearched = retour.pattern;
				}

				socket.emit('yt-result', retour);

				requestWorker.kill();

			});

			return;

		},

		/**
		 *	modifyVolume
		 *	
		 *	Execute un shell pour baisser/augmenter le volume de 5%
		 *	via le gestionnaire de son alsa
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

		}

	};


}

/**
 *	playSound
 *
 *	Fonction qui lance la lecture du mp3 sur la machine serveur via l'utilitaire mplayer
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
