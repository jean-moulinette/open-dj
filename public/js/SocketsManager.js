(function(){

	"use strict";

	var SocketManager = {

		//Attribut conn : Liaison avec le serveur socket.io
		conn : false,

		//Passera à true quand la classe YoutubePlayer sera initialisée (Permet d'eviter les conficts lorsque la connection sockets à perimée)
		youtubePlayerInitialized : false,

		linkServerEnabled : false,

		initialize : function(){

			//Récuperation des config serveur
			var host = $('#config').data('host'),
			port = $('#config').data('port');

			//Destruction de la div config
			$('#config').remove();

			var address = (port) ? host + ':' + port : host;

			//Etablissement de la connection bidrectionelle entre le serveur et le clients présent
			self.conn = io.connect(address);

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

			//Listener d'annonce serveur
			self.conn.on('annoucement', function(annoucement){

				//Fais apparaitre une annonce via alertify
				alertify.warning(annoucement);

			});

			//Listener de reception de la valeur du volume de la musique
			self.conn.on('volume-value', function(volumeValue){

				YoutubePlayer.setVolumeIndicator(volumeValue);

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
			};

			self.conn.emit('reSyncUser', reSyncObject);

			//Popup de reconnection sur écran
			YoutubePlayer.reSynced();

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

	};

	var self = SocketManager;

	//Init immédiat du manager de socket
	$(document).ready(function(){
		SocketManager.initialize();
	});

	window.SocketManager = SocketManager;

})();
