module.exports = {

	/**
	 * [init socketRoutes]
	 * 
	 * @param  {[object]} io contient l'API des sockets [io instance]
	 * @param  {[object]} audioTools [Mon module audio ]
	 * @param  {[object]} VlcApi 	[Mon API Vlc node]
	 *
	 * @return {[undefined]}    [Stick sockets listeners in open-dj]
	 */
	init : function(io, audioTools, VlcApi){

		//Module de nettoyeur de chaine de caractères incompatible pour des URL
		var diacritics = require('diacritics');

		//Lance l'init de notre API Vlc
		VlcApi.init(io);

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

				socket.emit('annoucement', 'Bienvenue sur Open-Dj !');

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

				//Mise à jour de notre global pour garder le titre en mémoire
				serverGlobal.musicTitle = data.title;

			});

			//Commande IO de changement de musique en cours
			socket.on('forceChange', function(data){

				console.log('Un client force le changement d\'une musique en cours de lecture pour la musique : ' + data.title);

				VlcApi.stop();

				VlcApi.playSound(data);

				io.sockets.emit('annoucement', 'Un utilisateur vient de forcer une musique.');

				//Mise à jour de notre global pour garder le titre en mémoire
				serverGlobal.musicTitle = data.title;

			});

			//Commande IO de réglage du volume de diffusion de la musique
			socket.on('modifyVolume', function(data){
				VlcApi.volume(data);
			});

			//Commande IO de mise en pause de la lecture
			socket.on('pause', function(data){
				VlcApi.pause();
			});

			//Commande IO de remise en marche de la lecture
			socket.on('resume', function(data){
				VlcApi.play(data);
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

					VlcApi.addToPlaylist(data);

					//Envoi d'un evenement refresh playlist à tous les sockets, la classe JS coté client va s'occuper de l'affichage
					io.sockets.emit('playlist', serverGlobal.playlist);

					io.sockets.emit('annoucement', 'Un utilisateur vient d\'ajouter une musique dans la liste de lecture.');

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
