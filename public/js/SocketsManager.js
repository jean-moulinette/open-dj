(function(){

	"use strict";

	var SocketManager = {

		//Attribut conn : Liaison avec le serveur socket.io
		conn : false,

		initialize : function(){

			//Etablissement de la connection bidrectionelle entre le serveur et le clients présent
			self.conn = io.connect('192.168.1.86:1337');

			//Listener de connection établie
			self.conn.on('connect', function(data){
				self.conn.emit('new_user');

				//Init de la classe YoutubePlayer
				YoutubePlayer.initialize();
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
