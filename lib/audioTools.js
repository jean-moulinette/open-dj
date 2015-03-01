var child = require('child_process'); 

var fs = require('fs');

var requestTool = require('follow-redirects').http;

//Lu uniquement lorsqu'on un fork du child process est fait
if(process.argv[2] === 'playSound'){

	//Recuperation du nom de fichier à lancer
	var fileToPlay = process.argv[3];

	child.execSync('cd downloaded && cvlc '+fileToPlay);

	console.log('*****************************');
	console.log('*****************************');
	console.log('Traitement de la demande de lecture terminé.');
}

/**
 *	downloadVideo :
 *	Execute toutes les commandes pour recuperer le fichier mp3 dans le dossier ./downloaded
 *	@param: data - { object } - La data envoyée par le socket client
 */
function downloadVideo (data){
	
	var url = 'http://www.youtube.com/watch?v='+data.id;

	/**
	 *	Va dans le dossier 'downloaded',
	 *	execute youtube-dl options o pour renommer le fichier %(id)s pour l'id de la video et le format %(ext)s
	 *	extract audio pour recup juste le son et audio format réglé mp3
	 */
	var downloadCommand = 'cd downloaded && youtube-dl -o "%(id)s.%(ext)s" --extract-audio --audio-format mp3 '+url;

	//Execute le shell de téléchargement/conversion mp3 de la video youtube
	child.execSync(downloadCommand);
}

/**
 *	audioExist
 *	
 *	Va verifier que la vidéo n'a pas déjà été téléchargée
 *	
 *	@return - result - { boolean } - Si oui retourne true sinon false
 */
exports.audioExist = function(data){
	
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

		if(result){
			console.log('\nCe fichier MP3 existe déjà sur le serveur.\n');
			audioTools.faitPeterLeSon(data.id+'.mp3');
		}else{
			console.log('\nLe fichier n\'a pas été trouvé sur le serveur, téléchargement lancé...\n');
			downloadVideo(data);
			audioTools.faitPeterLeSon(data.id+'.mp3');
		}

	});
};

/**
 *	faitPeterLeSon
 *
 *	Lance la lecture de la piste mp3 sur le serveur
 */
exports.faitPeterLeSon = function(soundName){

	console.log('\nLancement de la piste MP3 sur le serveur.\n');

	//Fork du process main pour lire la piste audio sur le serveur
	child.fork('./lib/audioTools.js', ['playSound', soundName]);

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
			
			socket.emit('yt-result', htmlResponse);

		});

	});

	req.end();

	return;

};