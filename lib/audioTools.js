var child = require('child_process'); 

var fs = require('fs');
/**
 *	downloadVideo :
 *	Execute toutes les commandes pour recuperer le fichier mp3 dans le dossier ./downloaded
 *	@param: data - { object } - La data envoyée par le socket client
 */
exports.downloadVideo = function(data){
	
	var url = 'http://www.youtube.com/watch?v='+data.id;

	/**
	 *	Va dans le dossier 'downloaded',
	 *	execute youtube-dl options o pour renommer le fichier %(id)s pour l'id de la video et le format %(ext)s
	 *	extract audio pour recup juste le son et audio format réglé mp3
	 */
	var downloadCommand = 'cd downloaded && youtube-dl -o "%(id)s.%(ext)s" --extract-audio --audio-format mp3 '+url;

	//Execute le shell de téléchargement/conversion mp3 de la video youtube
	var downloadProcess = child.execSync(downloadCommand);
};

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

	var files = fs.readdirSync('./downloaded');

	var dirLength = files.length;
	
	//a chaque itteration on regarde si notre fichier correspond à l'id qu'on veut telecharger
	for(var i = 0; i < dirLength; i++){

		//Si ça match on return true pour juste executer le lecteur dessus plus tard au lieu de retelecharger la data
		if(files[i] === data.id+'.mp3'){ return true; }

	}

	return result;
};

/**
 *	Lance la lecture de la piste mp3 sur le serveur
 */
exports.faitPeterLeSon = function(soundName){

	console.log('\nLancement de la piste MP3 sur le serveur.\n');

	child.execSync('cd downloaded && vlc '+soundName);
};