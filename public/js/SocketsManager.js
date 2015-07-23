(function(){

	"use strict";

	var SocketManager = {

		//Attribut conn : Liaison avec le serveur socket.io
		conn : false,

		//Passera à true quand la classe YoutubePlayer sera initialisée (Permet d'eviter les conficts lorsque la connection sockets à perimée)
		youtubePlayerInitialized : false,

		//Permettra de garder en mémoire une musique à forcer lorsque le client dialoguera avec le serveur io pour changer une musique
		musicSelected : null,

		serverAdress : '192.168.1.32:1337',

		initialize : function(){

			//Etablissement de la connection bidrectionelle entre le serveur et le clients présent
			self.conn = io.connect(self.serverAdress);

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

				self.musicSelected = music;

				YoutubePlayer.initAlertChoice();

			});

			//Listener dee reception de l'url de téléchargement de la musique
			self.conn.on('song-download-accepted', function(){

				//Reception dynamique du fichier à télécharger (ouvre un prompt de DL)
				window.location.assign('http://'+SocketManager.serverAdress+'/download');

			});

			//Listener des echanges IO concernant la playlist
			self.conn.on('playlist', function(serverPlaylist){

				YoutubePlayer.refreshPlaylist(serverPlaylist);

			});

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

			alertify.warning('Demande envoyée !');
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

		/**
		 * [downloadMusic Demande l'autorisation au serveur pour télécharger une musique]
		 * 
		 * @return {[void]}
		 */
		downloadMusic : function(){

			self.conn.emit('music-download');

		}

	};

	var self = SocketManager;

	//Init immédiat du manager de socket
	$(document).ready(function(){
		SocketManager.initialize();
	});

	window.SocketManager = SocketManager;

})();
