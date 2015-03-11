(function(){

	"use strict";

	var SocketManager = {

		//Attribut conn : Liaison avec le serveur socket.io
		conn : false,

		//Passera à true quand la classe YoutubePlayer sera initialisée (Permet d'eviter les conficts lorsque la connection sockets à perimée)
		youtubePlayerInitialized : false,

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

		}

	};

	var self = SocketManager;

	//Init immédiat du manager de socket
	SocketManager.initialize();

	window.SocketManager = SocketManager;

})();
