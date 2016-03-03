(function(){

	'use strict';

	var app = angular.module('youtubeController', []);

	app.factory('searchWorkflow', ['appGlobalWorkflow', function(appGlobalWorkflow){

		var searchWorkflow = {

			//Will prevent the user from spamming searches
			seaching : false,

			//Store the count of videos results from youtube
			resultsCount : 0,

			//keep pagination state in memory
			currentPage : 1,

			//Will which pattern the user searched for the last time 
			lastSearchedPattern : '',

			//API route to request API for searching pattern on youtube
			//Deux params /:pattern/:page
			searchPatternApi : 'api/yt-search/',

			videoRequestResult:[],

			/**
			 * [buildSearchUrl Build the API url to request for searching videos]
			 * 
			 * @return {[string]} [an Url that can request the server's REST API to get videos results from youtube]
			 */
			buildSearchUrl : function(){
				return searchWorkflow.searchPatternApi + searchWorkflow.lastSearchedPattern + '/' + searchWorkflow.currentPage; 
			},

			/**
			 *	[getPage] Triggered when the user clicks an arrow to show more results 
			 *
			 *	@param : { string } - cmd - ('+' or '-') Tell if we want the next or previous result page
			 *	@param: {DOM Event Object}
			 */
			getPage : function(cmd, event){
				
				event.preventDefault();

				if(cmd === '+'){
					searchWorkflow.currentPage++;
				}else{
					searchWorkflow.currentPage--;
				}

				window.scrollTo(0,0);
			},

			/**
			 *	[YtSearchResponse] Triggered when on the $http promise's success callback
			 *
			 *	@param : { object } - data - server's response
			 */
			YtSearchResponse : function(response){

				searchWorkflow.videoRequestResult = searchWorkflow.fetchResultsFromResponse(response.data.result);

				//Reseting our resultCount spy
				searchWorkflow.resultsCount = 0;

				//Storing how many results we have found
				searchWorkflow.resultsCount = searchWorkflow.videoRequestResult.length;	

				//Reseting anti search spam security
				searchWorkflow.searching = false;

				//Removing overlay
				appGlobalWorkflow.toggleOverlay();

			},

			/**
			 *	fetchResultsFromResponse  Parse the Youtube Request Response and return blocks of videos
			 *	
			 *  @param: { string } - The html to parse
			 *
			 *	@return: { string } - Custom parse result
			 */
			fetchResultsFromResponse : function(data){

				var collectionOfVideos = [],
					garbageDom;		
				
				garbageDom = $.parseHTML(data);
				
				$(garbageDom).find('.yt-lockup').each(function(index){

					var linkImage;
					var imgSrc;
					var videoId;
					var title;

					//Recuperation du tag <a> et ses fils qui contient le href video + src de l'image
					linkImage = $(this).find('.yt-lockup-thumbnail');

					//Fetching youtube video ID
					videoId = $(linkImage).find('a').prop('href').split('v=')[1];

					//Recuperation du titre
					title = $(this).find('.yt-lockup-content').find('a').html();
					
					//We need to force the picture to load if we have 5 or more results
					if(index > 5){

						var imgForcedSrc = searchWorkflow.forceImageDisplay(linkImage);

						//if it succeed
						if(imgForcedSrc !== false){
							
							//we replace the src tag property value by our forced src result 
							$(linkImage).find('img').prop('src', imgForcedSrc);

						}
					
					}

					//Fetching our final img src property val link
					imgSrc = $(linkImage).find('img').prop('src');
					
					//Pushing this result in the collection to return
					collectionOfVideos.push({
						'id':videoId,
						'image':imgSrc,
						'title':title
					});

				});

				return collectionOfVideos;

			},

			/**
			 *	forceImageDisplay
			 *
			 * 	A little hack which will force img element to call their picture, because on youtube's front-end website,
			 * 	the video blocks are only displaying their pictures if you scroll into their area. 
			 *
			 *	@param: {Jquery object} - Our HTML block which contain the img tag
			 *
			 *	@return: {mixed} - false if failed/A string with the new src to set if the function succeed
			 */
			forceImageDisplay : function(videoBlock){

				var imgTag = $(videoBlock).find('img');

				var imgSrcInfo = $(imgTag).prop('src').split('.');

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
			 * [YtSearchFail Triggered when the $http promise fail]
			 */
			YtSearchFail : function(){
				
				appGlobalWorkflow.toggleOverlay();
				
				searchWorkflow.searching = false;
				
				alertify.error('Impossible de lancer une recherche :(');
			}

		};

		return searchWorkflow;

	}]);

	app.service('videosService', ['searchWorkflow', 'socketManager', 'appGlobalWorkflow', '$http', '$q', function(searchWorkflow, socketManager, appGlobalWorkflow, $http, $q){

		this.PlayingApiUrl = 'api/play-song';
		
		 /**
		  * [searchVideos Fetch videos from youtube with our REST API on the node server
		  *  Attached on the tag #launch-search in the main view]
		  * 
		  * @param  {[boolean]} clear [Reset pagination state spy]
		  * @return {[undefined]}
		  */
		this.searchVideos = function(clear){

			//If the websockets connection is still avaiable
			if( !socketManager.linkServerEnabled ){
				//Printing error notify
				alertify.error('Recherche non disponible.');

				return;
			}

			//If the user is already fetching some results
			if(searchWorkflow.searching){
				return;
			}

			//Reseting the pagination number spy
			if(clear){
				searchWorkflow.currentPage = 1;
			}

			var inputVal = $('#yt-search').val();

			if(inputVal !== ''){

				//This will prevent user from spamming same requests
				searchWorkflow.searching = true;

				//replacing spaces by '+' in the user's search pattern
				inputVal = inputVal.replace(/ /g, '+');

				//Storing the searchPattern in our workFlow class
				searchWorkflow.lastSearchedPattern = inputVal.toLowerCase();

				//Fetching searching results from our REST API
				$http({
					method:'GET',
					url:searchWorkflow.buildSearchUrl()
				}).then(
					searchWorkflow.YtSearchResponse, //success
					searchWorkflow.YtSearchFail	//error
				);

				//Toggling patiency overlay
				appGlobalWorkflow.toggleOverlay();

			}else{
				alertify.error('Tu veux faire une recherche vide ...?<br/>Tu vas pas trouver grand chose mon pote.');
			}
		};

		/**
		 *	searchVideos
		 *
		 * 	Ask the REST API to play video's sound on the node server
		 *	Attached in the anchor tag in the youtubeVideo directive	
		 *
		 *	@param: {object} 	- An object which contains evrything we need to know about the video (id title etc..)
		 *	@param: {boolean} 	- Force video to play, even if one is already playing
		 *	@param: {DOM Event Object}
		 *
		 *	@return: {undefined}
		 */
		this.playVideo = function(video, force, event){
			
			if(event){
				event.preventDefault();
			}

			//If the websockets connection is still avaiable
			if( !socketManager.linkServerEnabled ){
				//Printing error notify
				alertify.error('Lecture indisponible :(.');

				return;
			}

			//Building POST request params
			var parametersObject = {
				id:video.id,
				title:video.title,
				image:video.image,
				force:force
			};

			//Requesting our API server to play that song ID on his listening VlcPlayer
			$http({
				method:'POST',
				url:this.PlayingApiUrl,
				data:parametersObject
			}).then(
				this.handlePlaySongResponse.bind(this) , //success
				function(){//error
					alertify.error('Impossible de lire la musique :('); 
				}
			);
		
		};

		/**
		 *	handlePlaySongResponse
		 *	
		 *  @param: { string } - The result from the API Call '/api/play-song'
		 *
		 *	@return: { undefined }
		 */
		this.handlePlaySongResponse = function(response){
			
			//If the server gave back the video object, it means that he's already playing one
			if(response.data.id){

				this.askUserToForce()
				.then(function(){
					//Forcing song request
					this.playVideo(response.data, true);
				}.bind(this));	
			}
		
		};

		/**
		 * [askUserToForce Prompts the user if he wants to force the current song with his choice]
		 * 
		 * @return {[function]} [A promise which resolve  when the user has chosen to force]
		 */
		this.askUserToForce = function(){
			
			return $q(function(resolve){

				//Prompting user with an alert
				var alert = alertify.confirm().set({

					modal : false,
					
					message:'Une musique est déjà en cours de lecture...',
					
					//Force song
					onok : function(){	
						//Removing DOM garbages left by alertify
						$('.alertify').remove();
						resolve();
					},
					labels:{
						ok:'Forcer ma musique',
						cancel:'Annuler'
					},
					title:'C\'est embarassant...'
				}).show();

			});
		};

	}]);

	app.controller('youtubeCtrl', ['$scope', 'searchWorkflow', 'videosService', function($scope, searchWorkflow, videosService){
		$scope.videosService = videosService;
		$scope.searchWorkflow = searchWorkflow;
	}]);

	//The directive that will container the youtube search form
	app.directive('youtubeSearch', function(){

		return{
			restrict:'E',
			templateUrl:'/templates/youtube/youtube-search.html',
			controller : 'youtubeCtrl'
		};

	});

	//This one will be use on each videos fetched from youtube
	app.directive('youtubeVideo', function(){

		return{
			restrict:'E',
			templateUrl:'/templates/youtube/youtube-video.html'
		};

	});

})();