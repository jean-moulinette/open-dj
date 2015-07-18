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

		//Sauvegare le nombre de resultat envoyé par youtube
		resultsCount : 0,

		//Garde en mémoire la page de résultats en cours de visualisation
		currentPage : 1,

		//Initialisation du tab playlist à vide
		playlist : [],

		//Init
		initialize : function(){

			//Initialisation du menu mobile
			$(".button-collapse").sideNav();
			
			//Mise en place du listener sur le bouton de recherche de vidéos
			$('#launch-search').on('click', function(e){

				e.preventDefault();

				//Lancement de la fonction de recherche de vidéos de la classe 
				self.launchYtSearch();

			});

			//Listener touche entrée pour lancer aussi la recherche de vidéos
			$(document).on('keyup', function(e){

				//Si l'utilisateur est en focus sur l'input texte
				if($('#yt-search').is(':focus')){
	
					var code = e.keyCode || e.which;

					if(code == 13){


						e.preventDefault();

						//Lancement de la fonction de recherche de vidéos de la classe 
						self.launchYtSearch();
					}
				}

			});

			//Listeners sur les boutons de reglage du volume
			$('.volume-up').on('click', function(e){
				
				//Stop event original
				e.preventDefault();

				self.modifyVolume(e, 'up');

			});

			$('.volume-down').on('click', function(e){

				//Stop event original
				e.preventDefault();

				self.modifyVolume(e, 'down');

			});

			//Commande de mise en pause de la musique
			$('.music-pause').on('click', function(e){
				
				//Stop event original
				e.preventDefault();

				SocketManager.conn.emit('pause');

			});

			//Commande de remise en lecture de la musique
			$('.music-resume').on('click', function(e){
				
				//Stop event original
				e.preventDefault();

				SocketManager.conn.emit('resume');

			});

			//Listener download-song qui permet de télècharger une musique en cours de lecture
			$('.music-download').on('click',function(e){

				//Stop event original
				e.preventDefault();

				//Lancement de la fonction de téléchargement
				SocketManager.downloadMusic();
				

			});

			//log
			$('.ask-server').on('click', function(e){

				//Stop event original
				e.preventDefault();

				SocketManager.conn.emit('ask-server');

			});

			//Listeners de navigation entre les pages
			$('#page-prev').on('click', function(){
				self.getPage('-');
			});
			$('#page-next').on('click', function(){
				self.getPage('+');
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

			//On remet à 0 l'espion de navigation entre les pages de résultats
			self.currentPage = 1;

			var inputVal = $('#yt-search').val();

			if(inputVal !== ''){
	
				//Activation du dispositif anti spameur de recherches
				self.searching = true;

				//Mise en mémoire de la recherche dans la classe YoutubePlayer
				self.lastSearchedPattern = inputVal;
	
				SocketManager.conn.emit('yt-search', inputVal);

				//Mise en place de l'overlay de patience
				self.toggleOverlay();

			}else{
				alertify.error('Tu veux faire une recherche vide ...?<br/>Tu vas pas trouver grand chose mon pote.');
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

				self.manageClickVideo(this);

			});

			//Remise à false du bloqueur de recherche
			self.searching = false;		

			//Je botte le cul de l'overlay de patience
			self.toggleOverlay();
		},

		/**
		 *	manageClickVideo	La gestion du click sur une video recherchée
		 *
		 *	@param: { object } - video - L'élément DOM de la video cliquée
		 *
		 *	@return: { void } - Lance des événements sockets
		 */
		manageClickVideo : function(video){

			if(typeof video.href.split('v=')[1] == 'undefined'){
				
				alertify.error('On dirais que t\'as choisis autre chose qu\'une video(chaine youtube ou autre), ça va pas marcher :(<br/>Essayes encore =D');
				
				return;
			}

			var musicTitle = $(video).parent().find('.result-block-title').text();

			//Faire le process de capture d'image
			var image = '';

			var music = {
				action: 'play',
				id: video.href.split('v=')[1],
				title: musicTitle,
				image: image,
			};

			//On communique au serveur la vidéo à télécharger et lire sur les hauts parleurs, il fera le café tout seul
			SocketManager.conn.emit('video', music);

		},


		/**
		 *	getHtmlResult
		 *
		 *	@param: { string } - Le code html brut renvoyé par la request node
		 *
		 *	@return: { string } - Le code HTML de la réponse épurée
		 */
		getHtmlResult : function(data){

			//Remise à 0 du compteur de résultat
			self.resultsCount = 0;

			var htmlNinja = '';

			var garbageDom = $.parseHTML(data);

			//Increment du compteur de resultats de la classe
			self.resultsCount = $(garbageDom).find('.yt-lockup').size();			
			
			$(garbageDom).find('.yt-lockup').each(function(index){

				var linkImage;
				var imgSrc;
				var videoHref;
				var title;

				$(this).find('button').each(function(){
					$(this).remove();
				});

				//Recuperation du tag <a> et ses fils qui contient le href video + src de l'image
				linkImage = $(this).find('.yt-lockup-thumbnail');

				//Recuperation du href de la video
				videoHref = $(linkImage).find('a').prop('href');

				//Recuperation du titre
				title = $(this).find('.yt-lockup-content').find('a').html();
				
				//Forcer le chargement de l'image pour le client
				if(index > 5){

					var imgForcedSrc = self.forceImageDisplay(linkImage);

					//Si on a réussi à forcer l'image
					if(imgForcedSrc !== false){
						
						//Remplacement de l'image caché par l'image forcée
						$(linkImage).find('img').prop('src', imgForcedSrc);

					}
				}

				//Recuperation de la source de l'image après traitement
				imgSrc = $(linkImage).find('img').prop('src');
				
				//Création du div corréspondant à un block de resultat youtube
				var singleResult = '<div class="result-block col s12 m12 l4">';
				singleResult += '<a href="'+videoHref+'">';
				singleResult += '<img class="result-block-img" src="'+imgSrc+'"/>';
				singleResult += '</a><br/><span class="result-block-title">'+title+'</span>';
				singleResult += '</div>';

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

			//Si le client vient d'arriver et que le serveur lui indique qu'une musique est deja en cours de téléchargement
			if(title === 'downloading'){
				//On donne l'infos dans le menu headr
				title = 'Téléchargement d\'une musique en cours...';

				//Et il prend l'overlay bloquant dans sa trogne
				self.toggleOverlay();
			}

			$('.playing-now-title').text('    '+title);
		},

		/**
		 *	updatePlaylist
		 *
		 *	Actualise la playlist chez le client 	
		 *
		 *	@param: {playlist} - playlistObject - L'objet contenant les vidéos
		 *
		 *	@return: {void}
		 */		
		updatePlaylist : function(playlist){

		},

		/**
		 *	initAlertChoice
		 *
		 *	Ouvre la modal de proposition d'action au niveau du lecteur de musique
		 *	Permet de forcer/ajouter des musiques a la playlist partagée
		 *
		 *	@param: {string} - choice - up/down 
		 *
		 *	@return: {void}
		 */
		initAlertChoice : function(){

			//On fait apparaitre l'alerte
			alertify.confirm().set({

				message:'Une musique est déjà en cours de lecture...',

				onok:SocketManager.forceMusic,

				oncancel:SocketManager.addPlaylist,

				labels:{
					ok:'Fait péter le son !',
					cancel:'Ajouter à la playlist'
				},

				title:'C\'est embarassant...'

			}).show(); 

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
		},

		/**
		 *	loading
		 *
		 *	fonction permettant la mise en place d'un overlay bloquant
		 *
		 *	Pompée sur le fiddle  http://jsfiddle.net/eys3d/402/
		 *
		 *	@param: {void}
		 *
		 *	@return: {void}
		 */
		toggleOverlay : function(){

			//Si l'overlay est detecté on l'enléve à l'appel de la fonction
			if($('#overlay').length > 0){
				
				$('#overlay').remove();

				return;
			}

			// add the overlay with loading image to the page
			var over = '<div id="overlay">' +
			'<div class="progress">' +
			'<div class="indeterminate"></div>'+
			'</div>';
			
			$(over).appendTo('body');

		},

		/**
		 *	getPage
		 *
		 *	fonction permettant la navigation dans les pages de resultats
		 *
		 *	@param: cmd - {string} - + ou -
		 *
		 *	@return: {void}
		 */
		getPage : function(cmd){
			
			//Mise en place de l'overlay d'attente
			self.toggleOverlay();

			if(cmd === '+'){
				self.currentPage++;
			}else{
				self.currentPage--;
			}

			window.scrollTo(0,0);

			SocketManager.pageSwitch(self.currentPage);

		},

		/**
		 *	refreshPlaylist
		 *
		 *	Cette function sera appellée dés que l'objet playlist du serveur recevra un changement d'état (add/delete d'une musique dedans)
		 *	Elle va s'occuper soit de creer l'affichage de la playlist chez le client si c'est la premiere fois qu'une musique est ajoutée dedans
		 *	soit de mettre à jour cet affichage tout simplement.
		 *
		 *	@param: { array } - serverPlaylist - Le tableau playlist du serveur
		 *
		 *	@return: { void } 
		 */
		refreshPlaylist : function(serverPlaylist){

			//Reception de l'objet playlist du serveur
			console.log(serverPlaylist);

		},
	
	};

	var self = YoutubePlayer;

	window.YoutubePlayer = YoutubePlayer;

})();

