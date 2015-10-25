(function(){

	"use strict";

	var SocketManager = {

		//Attribut conn : Liaison avec le serveur socket.io
		conn : false,

		//Passera à true quand la classe YoutubePlayer sera initialisée (Permet d'eviter les conficts lorsque la connection sockets à perimée)
		youtubePlayerInitialized : false,

		//Permettra de garder en mémoire une musique à forcer lorsque le client dialoguera avec le serveur io pour changer une musique
		musicSelected : null,

		linkServerEnabled : false,

		serverAdress : '192.168.1.32',

		initialize : function(){

			//Etablissement de la connection bidrectionelle entre le serveur et le clients présent
			self.conn = io.connect(self.serverAdress);

			//Gestion perte de la liaison full duplex avec le serveur
			self.conn.on('disconnect', function(){
				
				//Les vannes sont fermées l'autre bout ne répond plus. 
				self.linkServerEnabled = false;

				//Gestion de l'erreur 
				YoutubePlayer.pingTimeout();

			});

			//Listener de connection établie
			self.conn.on('connect', function(data){

				//Les vannes sont ouvertes
				self.linkServerEnabled = true;

				//Permet de ne pas init deux fois sur le même client (voir definitition de l'attribut)
				if(!self.youtubePlayerInitialized){
					
					//Initialisation de la connection IO coté server
					self.conn.emit('new_user');
					
					//Init de la classe YoutubePlayer
					YoutubePlayer.initialize();					

					self.youtubePlayerInitialized = true;
				
				}else{

					//Si on avait juste perdu la liaison IO, on va juste relancer une synchronisation pour récuperer l'historique du client
					self.reSyncWithServer();

				}

			});

			//Listener de récupération de resultat de recherche
			self.conn.on('yt-result', function(data){
				
				//Lancement de la fonction de récupération du code HTML de la recherhce
				YoutubePlayer.YtSearchResponse(data.result);	

				//Si le scroller de page n'est pas visible
				if( !$('#yt-result-scroller').is(':visible') ){

					$('#yt-result-scroller').toggleClass('hidden');
				
				}  
				
				//Si on est sur la premiere page de resultat, et que le bouton suivant n'est pas visible, on l'affiche
				//Sinon on vérifie toujours qu'il est bien visible pour les autres pages si le nombre de résultats est égal à 20
				if(YoutubePlayer.currentPage == 1  && YoutubePlayer.resultsCount == 20 || YoutubePlayer.currentPage >= 2 && YoutubePlayer.resultsCount == 20){
					
					if( !$('#page-next').is(':visible') ){
						
						$('#page-next').toggleClass('hidden');
					
					}
				
				}

				//A partir de la deuxieme page, on affiche le bouton precedant
				if(YoutubePlayer.currentPage >= 2){

					if( !$('#page-prev').is(':visible') ){

						$('#page-prev').toggleClass('hidden');

					}
				
				}else if(YoutubePlayer.currentPage === 1 && $('#page-prev').is(':visible')){

					//Si on est sur la premiere page de resultats et que le bouton "précédent est visible, on le cache"
					$('#page-prev').toggleClass('hidden');

				}

			});

			//Listener de mise à jour de la musique en cours de lecture
			self.conn.on('update-current-music', function(data){
				YoutubePlayer.updateCurrentMusic(data);
			});


			//Listener d'annonce serveur
			self.conn.on('annoucement', function(annoucement){

				//Fais apparaitre une annonce via alertify
				alertify.warning(annoucement);

			});

			//Listener de demande de confirmation pour forcer le changement de la musique en cours
			self.conn.on('ask-force', function(music){

				self.musicSelected = music;

				YoutubePlayer.initAlertChoice();

			});

			//Listener des echanges IO concernant la playlist
			self.conn.on('playlist', function(serverPlaylist){

				YoutubePlayer.refreshPlaylist(serverPlaylist);

			});

		},

		/**
		 *	reSyncWithServer
		 *
		 *	Fonction déclenchée lorsque une resynchronisation au serveur est necessaire (connection IO broken)
		 *
		 *	@param: void
		 *
		 *	@return: void
		 */
		reSyncWithServer : function(){

			//On va envoyer un objet qui permettra au server de resynchroniser le socket avec son activité passé
			var reSyncObject = {
				searchingPattern : YoutubePlayer.lastSearchedPattern
			}

			self.conn.emit('reSyncUser', reSyncObject);

			//Popup de reconnection sur écran
			YoutubePlayer.reSynced();

		},

		/**
		 *	forceMusic
		 *
		 *	Fonction déclenchée lorsque l'utilisateur confirme le changement d'une musique par une autre 
		 *	Voir commande io ask-force
		 *
		 *	@param: void
		 *	@return: void
		 */
		forceMusic : function(){

			self.conn.emit('forceChange', self.musicSelected);

			self.musicSelected = null;
		},

		/**
		 *	addPlaylist
		 *
		 *	Fonction déclenchée lorsque l'utilisateur confirme l'ajout d'un titre à la playlist du serveur 
		 *	Voir commande io playlist
		 *
		 *	@param: void
		 *	@return: void
		 */
		addPlaylist : function(){

			//Indique l'action d'ajout sur la liste de lecture du serveur
			self.musicSelected.action = 'add';

			//Lance la requete d'ajout vers le serveur IO
			self.conn.emit('playlist', self.musicSelected);

		},

		/**
		 *	modifyVolume
		 *
		 *	Permet de diminuer/augmenter le volume de la musique diffusée 	
		 *
		 *	@param: {string} - choice - up/down 
		 *
		 *	@return: {void}
		 */
		modifyVolume : function(choice){
			self.conn.emit('modifyVolume', choice);
		},

		/**
		 *	pageSwitch
		 *
		 *	Fonction permettant de ramener de nouvelles pages d'une même recherche
		 *
		 *	@param: { int } - le numéro de la page
		 *
		 *	@return: { void } 
		 */
		pageSwitch : function(index){

			self.conn.emit('result-page-change', index);

		},

	};

	var self = SocketManager;

	//Init immédiat du manager de socket
	$(document).ready(function(){
		SocketManager.initialize();
	});

	window.SocketManager = SocketManager;

})();
