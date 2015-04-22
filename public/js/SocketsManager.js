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

			//Listener de musique en cours de téléchargement sur le serveur
			self.conn.on('download-start', function(data){

				//Mise en place d'loverlay d'attente pour les clients
				YoutubePlayer.toggleOverlay();

			});

			//Listener de fin de téléchargement
			self.conn.on('download-over', function(data){
				
				//Enlevement de l'overlay d'attente chez les clients	
				if($('#overlay').is(':visible')){
					YoutubePlayer.toggleOverlay();
				}
			
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
		},

		/**
		 *	pageSwtich
		 *
		 *	Fonction permettant de ramener de nouvelles pages d'une même recherche
		 *
		 *	@param: { int } - le numéro de la page
		 *
		 *	@return: { void } 
		 */
		pageSwitch : function(index){

			self.conn.emit('result-page-change', index);

		}


	};

	var self = SocketManager;

	//Init immédiat du manager de socket
	SocketManager.initialize();

	window.SocketManager = SocketManager;

})();
