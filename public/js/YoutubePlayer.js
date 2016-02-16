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

		//API route to request API for searching pattern on youtube
		//Deux params /:pattern/:page
		searchPatternApi : 'api/yt-search/',

		//API route to play video on the server
		playSoundApi : 'api/play-song',

		//Permet de garder en mémoire le pattern de synchronisation
		lastSearchedPattern : null,

		//Detecteur de musique en cours de lecutre
		playing :  false,

		//Sauvegare le nombre de resultat envoyé par youtube
		resultsCount : 0,

		//Garde en mémoire la page de résultats en cours de visualisation
		currentPage : 1,

		//Initialisation du tab playlist à vide
		playlist : {},

		//Stockera l'id du timeout du popup open en place, en cas de deconnection
		pingTimeOutPopup : undefined,

		//Stockera l'id du timeout du popup open en place, en cas de reconnection
		reSyncPopup : undefined,

		//Init
		initialize : function(){

			//Initialisation du menu mobile
			$('.button-collapse').sideNav();
			
			//Mise en place du listener sur le bouton de recherche de vidéos
			$('#launch-search').on('click', function(e){

				e.preventDefault();

				//Lancement de la fonction de recherche de vidéos de la classe 
				self.launchYtSearch();

			});

			//Listeners sur les boutons de reglage du volume
			$('.volume-up').on('click', function(e){
				
				//Stop event original
				e.preventDefault();

				SocketManager.modifyVolume('up');

			});

			$('.volume-down').on('click', function(e){

				//Stop event original
				e.preventDefault();

				SocketManager.modifyVolume('down');

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

			//Switch theme
			$('.switch-theme').on('click', function(e){

				//Stop event original
				e.preventDefault();

				var currentTheme = $('html').css('background-color');
				var newTheme;

				//On passe du theme lumineu au theme sombre
				if(currentTheme === 'rgb(246, 244, 241)'){

					newTheme = {
						'background-color' : '#242220',
						'color' : 'white'
					};

				}else{

					newTheme = {
						'background-color' : '#F6F4F1',
						'color' : 'black'
					};

				}

				//Application du theme sur les markup html+body
				$('html,body').each(function(){
					$(this).css(newTheme);
				});

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

			//Si la connection avec le serveur webSocket à été perdue
			if( !SocketManager.linkServerEnabled ){

				//Affichage message d'erreur
				alertify.error('Recherche non disponible.');

				return;

			}

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

				//On remplace les espace par des '+' pour que ça fasse une requete GET potable par la suite
				inputVal = inputVal.replace(/ /g, '+');

				//Mise en mémoire de la recherche dans la classe YoutubePlayer
				self.lastSearchedPattern = inputVal.toLowerCase();

				//On va faire requeter l'API du serveur pour récuperer le resultat de la recherche
				$.ajax({
					type:'GET',
					url: self.buildSearchUrl(),
					success:YoutubePlayer.YtSearchResponse,
					error:function(){
						self.toggleOverlay();
						self.searching = false;
						alertify.error('Impossible de lancer une recherche :(');
					}
				});

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
		 *	@param : { object } - data - La réponse du serveur
		 */
		YtSearchResponse : function(data){
	
			data = $.parseJSON(data);

			data = data.result;

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

			//Si le scroller de page n'est pas visible
			if( !$('#yt-result-scroller').is(':visible') ){

				$('#yt-result-scroller').toggleClass('hidden');
			
			}
			
			//Si on est sur la premiere page de resultat, et que le bouton suivant n'est pas visible, on l'affiche
			//Sinon on vérifie toujours qu'il est bien visible pour les autres pages si le nombre de résultats est égal à 20
			if(self.currentPage == 1  && self.resultsCount == 20 || self.currentPage >= 2 && self.resultsCount == 20){
				
				if( !$('#page-next').is(':visible') ){
					
					$('#page-next').toggleClass('hidden');
				
				}
			
			}

			//A partir de la deuxieme page, on affiche le bouton precedent
			if(self.currentPage >= 2){

				if( !$('#page-prev').is(':visible') ){

					$('#page-prev').toggleClass('hidden');

				}
			
			}else if(self.currentPage === 1 && $('#page-prev').is(':visible')){

				//Si on est sur la premiere page de resultats et que le bouton "précédent est visible, on le cache"
				$('#page-prev').toggleClass('hidden');

			}

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

			var video = {
				id : video.href.split('v=')[1],
				title : $(video).parent().find('.result-block-title').text(),
				image : '' //work in progress 
			};

			//Make an ajax call to the server's API
			self.playSong(video, false);

		},

		/**
		 *	playSong 	 Ask the server to play video
		 *	
		 *  @param: { object } -	[video]		 An object describing the video to play on VlcApi
		 *  @param: { boolean } -	[force]		 A boolean which can force the audio request to play the song when one is already playing
		 * 
		 *	@return: { undefined }
		 */
		playSong : function(video, force){

			//Building POST request params
			var parametersObject = {
				id:video.id,
				title:video.title,
				image:video.image,
				force:force
			};

			var paramsEncoded = JSON.stringify(parametersObject);

			//Requesting the server to play the song
			$.ajax({
				type:'POST',
				url: self.playSoundApi,
				contentType:'application/json; charset=utf-8',
				dataType:'json',
				data:paramsEncoded,
				success: self.handlePlaySongResponse,
				error: function(){
					alertify.error('Impossible de lire la musique :(');
				}
			});

		},

		/**
		 *	handlePlaySongResponse
		 *	
		 *  @param: { string } - The result from the API Call '/api/play-song'
		 *
		 *	@return: { undefined }
		 */
		handlePlaySongResponse : function(data){

			//If the server gave back the video object, it means that he's already playing one
			if(data.id){

				//Launching alert choice to ask the user if he wants to force his song
				self.initAlertChoice(data);

			}

		},

		/**
		 *	getHtmlResult
		 *	
		 *  @param: { string } - Le code html brut renvoyé par la request node
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
		 *	initAlertChoice
		 *
		 *	Ouvre la modal de proposition d'action au niveau du lecteur de musique
		 *	Permet de forcer/ajouter des musiques a la playlist partagée
		 *
		 *	@param: {object} -	[video]		The video that the user'll potentially force 
		 *
		 *	@return: {undefined}
		 */
		initAlertChoice : function(video){

			//On fait apparaitre l'alerte
			var alert = alertify.confirm().set({

				modal : false,

				message:'Une musique est déjà en cours de lecture...',

				//Forcer musique
				onok : function(){

					//Forcing song request
					self.playSong(video, true);

					//Destruction des ordures laissés dans le DOM par le plugin
					$('.alertify').remove();

				},

				labels:{
					ok:'Forcer ma musique',
					cancel:'Annuler'
				},

				title:'C\'est embarassant...'

			}).show(); 

		},

		/**
		 *	addItemToServerPlaylist
		 *
		 *	Cette fonction a pour but d'effectuer quelques vérifications
		 *	avant de commander un ajout de musique dans la playlist du serveur
		 *
		 *	@param: {void} 
		 *
		 *	@return: {undefined} - Peut lancer un event à socketIO
		 */
		addItemToServerPlaylist : function(){

			for(var item in self.playlist){

				if(item === SocketManager.musicSelected){

					alertify.warning('Cette musique est déjà dans la playlist.');

					return;

				}

			}

			//Envoi de la commande IO pour que le serveur ajoute cette musique à sa playlist
			SocketManager.addPlaylist();

		},

		/**
		 *	loading
		 *
		 *	fonction permettant la mise en place d'un overlay bloquant
		 *
		 *	Pompée sur le fiddle  http://jsfiddle.net/eys3d/402/
		 *
		 *	@param: {[boolean]}	forceRemove Permet de forcer la suppression
		 *
		 *	@return: {void}
		 */
		toggleOverlay : function(forceRemove){

			//Si l'overlay est detecté on l'enléve à l'appel de la fonction
			if($('#overlay').length > 0 || forceRemove === true){
				
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
		 * [buildSearchUrl Build the API url to request for searching videos]
		 * 
		 * @return {[string]} [an Url that can request the server's REST API to get videos results from youtube]
		 */
		buildSearchUrl : function(){

			return self.searchPatternApi + self.lastSearchedPattern + '/' + self.currentPage; 

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

			//On va faire requeter l'API du serveur pour récuperer le resultat de la recherche
			$.ajax({
				type:'GET',
				url: self.buildSearchUrl(),
				success:YoutubePlayer.YtSearchResponse,
				error:function(){
					alertify.error('Impossible de lancer une recherche :(');
				}
			});

		},

		/**
		 *	setVolumeIndicator, 
		 *
		 *	Récupere la nouvelle valeur du volume VLC depuis socket io et l'integre dans la page du user
		 *
		 *	@param: volume - {string} - valeur du volume
		 *
		 *	@return: { void }	
		 */
		setVolumeIndicator : function(volume){

			$('.volume-indicator').each(function(){
				$(this).text(volume);
			});
			
		},

		/**
		 *	resynced, 
		 *
		 *	préviens l'utilisateur qu'il viens de se resynchroniser avec le serveur IO 
		 *
		 *	@param: { void } 
		 *
		 *	@return: { void }	
		 */
		reSynced : function(){

			//Si on avait déjà un timeOut en attente d"execution pour le popup, on le coupe et reprend depuis le début
			if( typeof self.reSyncPopup !== undefined ){
				clearTimeout(self.reSyncPopup);
			}

			self.reSyncPopup = setTimeout(function(){

				//On va fermer toutes les alerte ou notices alertify sur l'ecran du user
				alertify.closeAll();
				alertify.dismissAll();
				$('#overlay-transparent-loader').addClass('hidden');

				alertify.success('Connexion rétablie !<br/>Bonne écoute sur Open-Dj');

				//Force suppression overlay si il est la
				self.toggleOverlay(true);

				self.reSyncPopup = undefined;

			}, 3000);

		},

		/**
		 *	pingtimeout
		 *
		 *	Fonction lancée lorsque la connexion avec le serveur IO est perdue 
		 *
		 *	MHHHHHHHHHHHHHHHHHH... C'est embarassant :( 
		 *
		 *	@param: { void } 
		 *
		 *	@return: { void }	
		 */
		pingTimeout : function(){

			//Si on avait déjà un timeOut en attente d"execution pour le popup, on le coupe et reprend depuis le début
			if( typeof self.pingTimeOutPopup !== undefined ){
				clearTimeout(self.pingTimeOutPopup);
			}

			var timeoutTitle = 'Woops !';
			var timeoutMsg = 'Connexion avec le serveur perdue :(<br/><br/>Le service sera indisponible tant que la liaison n\'est pas réétablie';
			var notifyTxt = 'Reconnexion...';

			//Création d'un timeout qui fera apparaitre le message d'erreur
			//Le timeout permet de ne pas déclencher l'alerte pour rien la connexion est réétablie dans les secondes qui suivent
			self.pingTimeOutPopup = setTimeout(function(){

				//On va fermer toutes les alerter ou notices alertify sur l'ecran du user
				alertify.closeAll();
				alertify.dismissAll();

				//On fait apparaitre l'alerte
				alertify.alert('Connexion perdue', timeoutMsg)
				.set('onok', function(closeEvent){

					//Apparition du gif overlay
					$('#overlay-transparent-loader').removeClass('hidden');
					
					alertify.error(notifyTxt, 0);
				
				});

				//Remise à 0 de la variable contenant la function pingtimeoutpopup
				self.pingTimeOutPopup = undefined;

			},3000);

		}
	
	};

	var self = YoutubePlayer;

	window.YoutubePlayer = YoutubePlayer;

})();

