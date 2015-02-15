var child = require('child_process'); 

var fs = require('fs');

var requestTool = require('follow-redirects').http;
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
	child.execSync(downloadCommand);
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

	
	fs.readdir('./downloaded', function(err, files){

		var dirLength = files.length;
	
		//a chaque itteration on regarde si notre fichier correspond à l'id qu'on veut telecharger
		for(var i = 0; i < dirLength; i++){

			//Si ça match on return true pour juste executer le lecteur dessus plus tard au lieu de retelecharger la data
			if(files[i] === data.id+'.mp3'){ return true; }

		}

		return result;	
	});

};

/**
 *	faitPeterLeSon
 *
 *	Lance la lecture de la piste mp3 sur le serveur
 */
exports.faitPeterLeSon = function(soundName){

	console.log('\nLancement de la piste MP3 sur le serveur.\n');

	child.execSync('cd downloaded && vlc '+soundName);
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

	console.log('\n Un client cherche une vidéo. \n');

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
		
		var htmlNinja = '';

		requestResponse.setEncoding('utf8');

		requestResponse.on('data', function(chunk){
			htmlResponse += chunk;
		});

		requestResponse.on('end', function(){

			//var y = 10000000000;
			//Test de ralentissement de la recherche
			//while(y != 1){
			//	y--;
			//}

			//On créé un DOM en JS pour le traverse en jquery
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

};