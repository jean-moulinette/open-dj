var child = require('child_process'); 

var fs = require('fs');

//Lu uniquement lorsqu'on un fork du child process est fait

if(process.argv[2] === 'searchYoutube'){

	//Appel du module de requete
	var requestTool = require('follow-redirects').http;

	//Lancement de la requête avec un evenement d'envoi de Message au process en fin 
	searchYoutube(process.argv[3]);

}
else if(process.argv[2] == 'downloadMp3'){

	console.log('\nLe fichier n\'a pas été trouvé sur le serveur, téléchargement lancé...\n');

	//Création de l'url de tléchargement via l'identifiant envoyé au fork du process
	var url = 'http://www.youtube.com/watch?v='+process.argv[3];

	/**
	 *	Va dans le dossier 'downloaded',
	 *	execute youtube-dl options o pour renommer le fichier %(id)s pour l'id de la video et le format %(ext)s
	 *	extract audio pour recup juste le son et audio format réglé mp3
	 */
	var downloadCommand = 'cd downloaded && youtube-dl -o "%(id)s.%(ext)s" --extract-audio --audio-format mp3 '+url;

	//Execute le shell de téléchargement/conversion mp3 de la video youtube
	child.execSync(downloadCommand);

	//Maintenant que le fichier est téléchargé, on peut changer l'argument du process pour qu'il procède à la lecture
	process.argv[2] = 'playSound';

	process.argv[3] = process.argv[3]+'.mp3';

}
if(process.argv[2] === 'playSound'){

	console.log('\nCe fichier MP3 existe déjà sur le serveur.\n');
	console.log('\nLancement de la piste MP3 sur le serveur.\n');

	//Recuperation du nom de fichier à lancer
	var fileToPlay = process.argv[3];

	//Envoi du titre de la musique au process parent pour qu'il puisse le mettre dans le 'playing now' de tous les clients sockets
	process.send({
		title:process.argv[4]
	});

	child.execSync('cd downloaded && cvlc '+fileToPlay);

	console.log('*****************************');
	console.log('*****************************');
	console.log('Traitement de la demande de lecture terminé.');
}

/**
 *	searchYoutube
 *
 *	Lance la requete sur youtube pour ramener des choix de vidéos
 */
function searchYoutube(data){
	
	//On met tout les caractere en minuscules
	data = data.toLowerCase();

	//On remplace les espace par des '+' pour que ça fasse une requete GET
	data = data.replace(/ /g, '+');

	var hostName = 'youtube.com';

	var requestOptions = {
		host: hostName,
		path:'/results?search_query='+data,
		port:'80'
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
				result:htmlResponse
			});
		});

	});

	req.end();

}

/**
 *	audioExist
 *	
 *	Va verifier que la vidéo n'a pas déjà été téléchargée, puis va lancer la lecture dans un forked child
 *
 *	 @param: { object } - data - Un objet contenent l'id de la video + titre 
 *			 { object } - sockets - L'objet socket représantant tous les clients connectés (Permettra de leur mettre à jour le titre de la musique en cours)
 *	
 *	@return - result - { boolean } - Si oui retourne true sinon false
 */
exports.audioExist = function(data, sockets){
	
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

		var playingProcess;

		//Si on l'a, on lance la lecture
		if(result){
			//Fork du process main pour lire la piste audio sur le serveur
			playingProcess = child.fork('./lib/audioTools.js', ['playSound', data.id+'.mp3', data.title]);
		}else{
			//Fork du process main pour télécharger le fichier mp3
			playingProcess = child.fork('./lib/audioTools.js', ['downloadMp3', data.id, data.title]);
		}

		//Quand le child enverra un message, ça voudra dire que la lecture va commencer
		playingProcess.on('message', function(data){

			//Il va nous renvoyer le titre de la musique qu'on va renvoyer à tous les clients connectés
			sockets.emit('update-current-music', data.title);

			//Mise à jour de l'objet global représant la musique en cours de lecture
			playingStatus.on = true;
			playingStatus.title = data.title;
		});

	});
};

/**
 *	searchVideo
 *	
 *	Fais une request sur youtube pour ramener les resultats
 *	chez le nav client
 *
 *	@param: data - {string} - La chaine envoyé par le client
 *	@param: socket - {socket} - Le socket du client
 */
exports.searchVideo = function(data, socket){

	//Fork du process pour liberer le serveur express
	var requestWorker = child.fork('./lib/audioTools.js', ['searchYoutube', data]);

	requestWorker.on('message', function(retour){

		socket.emit('yt-result', retour.result);

		requestWorker.kill();

	});

	requestWorker.on('exit', function(code,signal){
		console.log('Le child de l\'envoi requête est bien mort.\n');
	});

	return;

};