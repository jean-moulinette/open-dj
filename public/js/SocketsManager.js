(function(){

	"use strict";

	var SocketManager = {

		//Attribut conn : Liaison avec le serveur socket.io
		conn : false,

		//Passera à true quand la classe YoutubePlayer sera initialisée (Permet d'eviter les conficts lorsque la connection sockets à perimée)
		youtubePlayerInitialized : false,

		//Permettra de garder en mémoire une musique à forcer lorsque le client dialoguera avec le serveur io pour changer une musique
		musicToForce : null,

		initialize : function(){

			//Etablissement de la connection bidrectionelle entre le serveur et le clients présent
			self.conn = io.connect('192.168.1.86:1337');

			//Listener de connection établie
			self.conn.on('connect', function(data){

				self.conn.emit('new_user');

				//Permet de ne pas init deux fois sur le même client (voir definitition de l'attribut)
				if(!self.youtubePlayerInitialized){
					//Init de la classe YoutubePlayer
					YoutubePlayer.initialize();					
				}

				self.youtubePlayerInitialized = true;
			});

			//Listener d'envoi de la réponse de la recherche 
			self.conn.on('yt-result', function(data){
				YoutubePlayer.YtSearchResponse(data);
			});

			//Listener de mise à jour de la musique en cours de lecture
			self.conn.on('update-current-music', function(data){
				YoutubePlayer.updateCurrentMusic(data);
			});

			//Listener de musique en cours de téléchargement sur le serveur
			self.conn.on('download-start', function(data){

				//Mise en place d'loverlay d'attente pour les clients
				YoutubePlayer.toggleOverlay();

			});

			//Listener de fin de téléchargement
			self.conn.on('download-over', function(data){
				
				//Enlevement de l'overlay d'attente chez les clients	
				YoutubePlayer.toggleOverlay();
			
			});

			//Listener d'annonce serveur
			self.conn.on('annoucement', function(annoucement){

				//Fais apparaitre une annonce via alertify
				alertify.warning(annoucement);

			});

			//Listener de demande de confirmation pour forcer le changement de la musique en cours
			self.conn.on('ask-force', function(music){

				self.musicToForce = music;

				var confirmMessage = 'Une musique est déjà en cours de lecture !<br/>Tu veux forcer le changement ..?';

				//On fait apparaitre l'alerte
				alertify.confirm().set({

					message:confirmMessage,

					onok:self.askForceOnOk,

					labels:{
						ok:'Fait péter le son !',
						cancel:'Non merci'
					},

					title:'Woops !'

				}).show(); 

			});

		},

		/**
		 *	askForceOnOk
		 *
		 *	Fonction déclenchée lorsque l'utilisateur confirme le changement d'une musique par une autre 
		 *	Voir commande io ask-force
		 *
		 *	@param: void
		 *	@return: void
		 */
		askForceOnOk : function(){

			self.conn.emit('forceChange', self.musicToForce);

			self.musicToForce = null;

			alertify.warning('Demande envoyée !');
		}

	};

	var self = SocketManager;

	//Init immédiat du manager de socket
	SocketManager.initialize();

	window.SocketManager = SocketManager;

})();
