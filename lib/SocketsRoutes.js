module.exports = {

	/**
	 * [init socketRoutes]
	 * 
	 * @param  {[object]} io contient l'API des sockets [io instance]
	 * @param  {[object]} audioTools [Mon module audio ]
	 *
	 * @return {[undefined]}    [Stick sockets listeners in open-dj]
	 */
	init : function(io, audioTools){

		//Module de nettoyeur de chaine de caractères incompatible pour des URL
		var diacritics = require('diacritics');

		var VlcApi = require('../lib/VlcApi.js');

		/**
		 *	Initialisation du serveur IO
		 *
		 *	Attachement des event listeners sur les connexions sockets
		 *
		 *	Event : Connection @return : { Obj } socket 
		 *	[L'objet représentant une connection bidirectionnelle établie entre la machine cliente et le serveur node.]
		 *
		 **/
		io.sockets.on('connection', function(socket){

			//Commande IO init de la connection bidrectionelle avec le client
			socket.on('new_user', function(data){

				console.log('\n Un visiteur vient de se connecter.\n');

				//Si une musique est déjà en cours
				if(serverGlobal.on){

					//On indique le titre au nouveau client
					socket.emit('update-current-music', serverGlobal.musicTitle);

				}else if(serverGlobal.downloading){//Si aucune musique n'est en cours mais que le serveur est en train de traiter une demande

					//On lui colle un overlay avec un titre de musique indiquant le téléchargement en cours
					socket.emit('update-current-music', 'downloading');			

				}

			});

			//Commande IO de resynchronisation avec le client lorsque la liaison IO à pété
			socket.on('reSyncUser', function(reSyncObject){

				//Gestion du dernier pattern de recherche du client
				if(reSyncObject.searchingPattern !== null){

					//On enleve la diactrics en resynchronisant l'attribut patternSearched de l'objet socket du client
					socket.patternSearched = diacritics.remove(reSyncObject.searchingPattern);

				}
			
			});

			//Commande IO de recherche sur youtube
			socket.on('yt-search', function(searchPattern){

				//Remise à zero de l'espion de recherche
				socket.patternSearched = null;

				//On dégage la dacritic du pattern de recherche
				searchPattern = diacritics.remove(searchPattern);

				console.log('\n Un client effectue une recherche : '+searchPattern+'. \n');

				//Envoi des résultats de la recherche au client par le serveur
				audioTools.searchVideo(searchPattern, socket);

			});

			socket.on('result-page-change', function(index){

				console.log('\n Un utilisateur parcours une page de resultat. Pattern: '+socket.patternSearched);

				//Envoi d'une nouvelle requette avec index comme pour numéro de page de résulrat
				//On récupere socket.patternSearched qui à pris sa valeur dans audioTools.searchVideo lors de la première recherche
				audioTools.searchVideo(socket.patternSearched+'&page='+index, socket);

			});

			//Commande IO de récéption d'une requête vidéo spécifique youtube à lire
			socket.on('video', function(data){

				//Si une musique est déjà en cours de lecture
				if(serverGlobal.on){

					//On va envoyer une notification au socket pour savoir si il veut kick le son en cours
					socket.emit('ask-force', data);

					//On sort de la fonction sinon ça va lancer le son en double..
					return;

				}

				console.log('\nDemande de lecture reçue par le client, titre : '+data.title+'\n');

				VlcApi.playSound(data);
/*				//Si le serveur n'est pas déjà en train de traiter une demande
				if(!serverGlobal.downloading){

					//On indique que le serveur est en train de traiter une demande
					serverGlobal.downloading = true;

					//Le serveur prends la vidéo et fait le necessaires pour la lire
					audioTools.audioExist(data, io.sockets, false);

				}
*/
			});

			//Commande IO de changement de musique en cours
			socket.on('forceChange', function(data){

				console.log('Un client souhaite forcer le changement d\'une musique en cours de lecture');

				//On indique que le serveur est en train de traiter une demande
				serverGlobal.downloading = true;

				//Le serveur prends la vidéo et fait le necessaires pour la lire
				audioTools.audioExist(data, io.sockets, true);	
			
			});

			//Commande IO de réglage du volume de diffusion de la musique
			socket.on('modifyVolume', function(choice){

				if(!serverGlobal.on){

					socket.emit('annoucement', 'Aucune musique n\'est en cours de lecture.');

					return;
				}

				audioTools.modifyVolume(choice);
			
			});

			//Commande IO de mise en pause de la lecture
			socket.on('pause', function(data){

				if(!serverGlobal.on){

					socket.emit('annoucement', 'Aucune musique n\'est en cours de lecture.');

					return;
				}

				var messageObject = {
					command:'pause'
				};

				//Envoi de la commande de pause au child process
				serverGlobal.process.send(messageObject);

				//Mise à jour de l'objet représentant la lecture de la musique sur le serveur
				serverGlobal.paused = true;			


			});

			//Commande IO de remise en marche de la lecture
			socket.on('resume', function(data){

				if(!serverGlobal.on){

					socket.emit('annoucement', 'Aucune musique n\'est en cours de lecture.');

					return;
				}

				var messageObject = {
					command:'resume'
				};

				//Envoi de la commande de remise en marche du lecteur serveur
				serverGlobal.process.send(messageObject);

				//Mise à jour de l'objet représentant la lecture de la musique sur le serveur
				serverGlobal.paused = false;

			});

			//Routes de raffraichissement de la playlist
			socket.on('playlist', function(data){

				//Récuperation de l'action sur la playlist
				var action = data.action;

				// Gérrer 3 cas,
				// 	- ajout d'un nouveau titre ( faire ensuite un raffraichissement sur tous les sockets)
				// 	- demande de suppression d'un élément de playlist
				// 	- Le raffraichissement se fait automatiquement dés qu'une interraction est faite sur la playlist
				if(action === 'add'){

					//Etant donné qu'on va enregistrer cette objet dans l'objet playlist, on va virer l'action qui est maintenant inutile
					delete data.action;

					console.log('\n Ajout d\'une musique dans la playlist.\n');

					//Ajout de la nouvelle musique dans la playlist du serveur
					serverPlaylist[data.id] = {
						title:data.title,
						image:data.image
					};

					//Envoi d'un evenement refresh playlist à tous les sockets, la classe JS coté client va s'occuper de l'affichage
					io.sockets.emit('playlist', serverGlobal.playlist);

				}else if(action === 'delete'){

					console.log('\nUn utilisateur vient de commander la suppression d\'un objet dans la playist\n');

				}

			});

			//Routes de monitoring des globales
			socket.on('ask-server', function(){

				console.log('serverGlobal :\n');

				console.log('on :'+serverGlobal.on+'\n');
				console.log('downloading :'+serverGlobal.downloading+'\n');
				console.log('musicTitle :'+serverGlobal.musicTitle+'\n');
				console.log('paused :'+serverGlobal.paused+'\n');
				console.log('songId :'+serverGlobal.songId+'\n');
				
				console.log('Playlist:');

				for(var item in serverPlaylist){
					
					console.log('item:');

					console.log(item);

					for(var itemAttr in serverPlaylist[item]){
						console.log(serverPlaylist[item][itemAttr]);
					}

				}

			});

		});

	},

};
