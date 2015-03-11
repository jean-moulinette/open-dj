/**
 *	Class YoutubePlayer
 *
 *	Gère toute la partie audio.
 */
(function(){

	"use strict";

	var YoutubePlayer = {

		//Dispositif anti troll-spammeur. Bloquera les recherches pendant le traitement du serveur d'une recherche
		searching : false,

		//Detecteur de musique en cours de lecutre
		playing :  false,

		//Init
		initialize : function(){
			//Mise en place du listener sur le bouton de recherche de vidéos
			$('#launch-search').on('click', function(e){

				e.preventDefault();

				self.launchYtSearch();
			});

			//Listeners sur les boutons de reglage du volume
			$('#volume-up').on('click', function(e){
				
				//Stop event original
				e.preventDefault();

				self.modifyVolume(e, 'up');
			});
			$('#volume-down').on('click', function(e){

				//Stop event original
				e.preventDefault();

				self.modifyVolume(e, 'down');
			});

		},

		/**
		 *	launchYtSearch
		 *
		 *	Fonction appellé au clic sur le bouton de recherche
		 */
		launchYtSearch : function(){

			//Si l'utilisateur à une recherche en cours, je le kick de la fonction
			if(self.searching){
				return;
			}

			//Activation du dispositif anti spameur de recherches
			self.searching = true;

			var inputVal = $('#yt-search').val();

			if(inputVal !== ''){
				SocketManager.conn.emit('yt-search', inputVal);
			}else{
				alert('Tu veux faire une recherche vide ...?');
				alert('Et bien ça marche pas avec moi !');
				alert('En plus je te fais chier avec des alertes LOL AHAHA JE ME MARRE TROP QUOI');
			}
		},

		/**
		 *	YtSearchResponse
		 *
		 *	Function déclenchée lors de la réponse de socket.io concernant la recherche youtube
		 *
		 *	@param : { string } - data - La réponse de socket.io sous forme de string
		 */
		YtSearchResponse : function(data){
			
			//Filtrage de la réponse pour ne ressorir uniquement les élements intéréssants
			data = self.getHtmlResult(data);

			$('#search-yt-results').html(data).find('a').click(function(event){

				//Stop event original
				event.preventDefault();

				if(typeof this.href.split('v=')[1] == 'undefined'){
					alert('On dirais que t\'as choisis autre chose qu\'une video(chaine youtube ou autre), ça va pas marcher :(\nEssayes encore =D');
					return;
				}

				var musicTitle = $(this).parent().find('.video-title').text();

				var sendRequestToRpi = {
					action: 'play',
					id: this.href.split('v=')[1],
					title: musicTitle
				};

				if(sendRequestToRpi !== ''){
					SocketManager.conn.emit('video', sendRequestToRpi);

					alert('Enjoy');
				}
			});

			//Remise à false du bloqueur de recherche
			self.searching = false;		
		},

		/**
		 *	getHtmlResult
		 *
		 *	@param: { string } - Le code html brut renvoyé par la request node
		 *
		 *	@return: { string } - Le code HTML de la réponse épurée
		 */
		getHtmlResult : function(data){

			var htmlNinja = '';

			var garbageDom = $.parseHTML(data);

			$(garbageDom).find('.yt-lockup').each(function(index){

				$(this).find('button').each(function(){
					$(this).remove();
				});

				var linkImage = $(this).find('.yt-lockup-thumbnail');

				//Forcer le chargement de l'image pour le client
				if(index > 5){

					var imgForcedSrc = self.forceImageDisplay(linkImage);

					if(imgForcedSrc !== false){
						//Remplacement de l'image caché par l'image forcée
						$(linkImage).find('img').attr('src', imgForcedSrc);

					}
				}

				//On reparse l'objet jquery en html après le traitement de l'image
				linkImage = $(linkImage).html();

				var title = $(this).find('.yt-lockup-content').find('a').html();

				//Création du div corréspondant à un block de resultat youtube
				var singleResult = '<div class="result-block">'+linkImage+'<span class="video-title">'+title+'</span>'+'</div><br/><br/><br/>';

				htmlNinja += singleResult;
			});

			return htmlNinja;
		},

		/**
		 *	forceImageDisplay
		 *
		 *	Fonction de gruge pour forcer les images supérieure à 5 resultats à s'afficher 
		 *	Parceque youtube les affiche uniquement via un script un js quand l'utilisateur
		 *	scroll dans la zone ou se trouve l'image
		 *
		 *	@param: {Jquery object} - le set d'élements qui contient la balise img
		 *
		 *	@return: {mixed} - false si echec/Un string avec le nouveau src en cas de réussite 
		 */
		forceImageDisplay : function(videoBlock){

			var imgTag = $(videoBlock).find('img');

			var imgSrcInfo = $(imgTag).attr('src').split('.');

			var ext = imgSrcInfo[(imgSrcInfo.length - 1)];

			//Si l'image n'est pas chargé, le src contient un gif de 1 pixel
			if(ext === 'gif'){

				//Je remplace le src par la chaine contenue dans data-thumb qui contient le path
				return $(imgTag).data('thumb');
			}else{
				return false;
			}		
		},

		/**
		 *	updateCurrentMusic
		 *
		 *	Fonction de mise à jour du titre de la musique en cours lorsque le serveur va jouer un titre
		 *	Cette fonction sera potentiellement partagée pour tous les clients connectés en même temps 	
		 *
		 *	@param: {string} - title - Le titre de la musique
		 *
		 *	@return: {void} - vide néant rien quedalle nada  
		 */
		updateCurrentMusic : function(title){
			$('#playing-now-title').text('    '+title);
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
		modifyVolume : function(event, choice){
			SocketManager.conn.emit('modifyVolume', choice);
		}		
	
	};

	var self = YoutubePlayer;

	window.YoutubePlayer = YoutubePlayer;

})();

