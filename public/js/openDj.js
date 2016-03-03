(function(){
	
	'use strict';

	var app = angular.module('openDj', ['btford.socket-io', 'dashBoard', 'youtubeController', 'playerWidget']);

	//Service to interact with the socket library
	app.factory('socket', function (socketFactory){

		//fetching server config
		var host = $('#config').data('host'),
		port = $('#config').data('port');

		//destroying the element that used to store the server configuration
		$('#config').remove();

		var webSocketAddress = (port) ? host + ':' + port : host;

		var myIoSocket = io.connect(webSocketAddress);

		var socket = socketFactory({
			ioSocket: myIoSocket
		});

		return socket;
	});

	app.service('socketManager',['socket', 'appGlobalWorkflow', function(socket, appGlobalWorkflow){

		var self = this;

		//Will spy the connection state
		this.linkServerEnabled = false;

		this.initialized = false;

		socket.on('connect', function(){
			
			self.linkServerEnabled = true;

			//Establishing first communication between the client and the server
			if(!self.initialized){
				//Notice the server that we are now linked
				socket.emit('new_user');
				self.initialized = true;
			}else{
				appGlobalWorkflow.reSynced();
			}

		});

		socket.on('disconnect', function(){

			//Telling our service that the link is broken
			self.linkServerEnabled = false;

			//Toggling an overlay and an annoucement on the user screen
			appGlobalWorkflow.pingTimeout();

		});

		socket.on('announcement', function(annoucement){
			//Fais apparaitre une annonce via alertify
			alertify.warning(annoucement);
		});

		//DEPRECATED Listener des echanges IO concernant la playlist
		//socket.conn.on('playlist', function(serverPlaylist){});

	}]);

	app.service('appGlobalWorkflow', ['$timeout', '$q', function($timeout, $q){

		var self = this;

		//Will trigger an overlay on the view during regular transactions
		this.overlay = false;	

		//Will display an overlay when the link with the server has been lost
		this.disconnectOverlay = false;

		//Will the timeout's id of the popup openning when the websocket connection is lost
		this.pingTimeOutPopup = undefined;

		/**
		 *	toggleOverlay toggle an overlay on the whole HTML view
		 *
		 *	From that fiddle  http://jsfiddle.net/eys3d/402/
		 *
		 *	@param: {[boolean]}	force overlay suppression
		 *
		 *	@return: {void}
		 */
		this.toggleOverlay = function(forceRemove){

			//Force to false
			if(forceRemove){
				self.overlay = false;
				return;
			}

			self.overlay = !self.overlay;

		};

		/**
		 *	pingtimeout
		 *
		 *	Triggered when the websocket connection is lost
		 *	Will prompt and notify the user 
		 *
		 *	Wooooooooooops... something went wrong :( 
		 *
		 *	@param: { void } 
		 *
		 *	@return: { void }	
		 */
		this.pingTimeout = function(){

			//If we already had stored a popup timeout before, which ain't got the time to ends, we shut it 
			if(self.pingTimeOutPopup !== undefined){
				$timeout.cancel(self.pingTimeOutPopup);
			}

			//Creating a timeout which will display an error animation on the screen
			//The timeout is useful to prevent the alert from being triggered when the websocket link has been fastly recovered
			self.pingTimeOutPopup = $timeout(function(){

				self.pingTimeOutPrompt()
				.then(function(){
					//Display disconnect overlay with a last notify
					self.disconnectOverlay = true;
					alertify.error('Reconnexion...', 0);
				});

			},3000);


		};

		/**
		 * [pingTimeOutPrompt A promised function which will prompt the user about the losted connection and resolve when the has clicked the prompt]
		 * 
		 * @return {[Object]} [Promise object]
		 */
		this.pingTimeOutPrompt = function(){

			return $q(function(resolve){

				var timeoutMsg = 'Connexion avec le serveur perdue :(<br/><br/>Le service sera indisponible tant que la liaison n\'est pas réétablie';
	
				//Closing every single alert or notify previously launched on the user's screne
				alertify.closeAll();
				alertify.dismissAll();

				alertify.alert('Connexion perdue', timeoutMsg)
				.set('onok', function(){
					resolve();
				});

				//Reseting our timeout spy
				self.pingTimeOutPopup = undefined;

			});

		};

		/**
		 *	resynced, 
		 *
		 *	préviens l'utilisateur qu'il viens de se resynchroniser avec le serveur IO 
		 *
		 *	@param: { void } 
		 *
		 *	@return: { void }	
		 */
		this.reSynced = function(){

			//Si on avait déjà un timeOut en attente d"execution pour le popup, on le coupe et reprend depuis le début
			if(self.reSyncPopup !== undefined ){
				$timeout.cancel(self.reSyncPopup);
			}

			self.reSyncPopup = $timeout(function(){

				//On va fermer toutes les alerte ou notices alertify sur l'ecran du user
				alertify.closeAll();
				alertify.dismissAll();

				alertify.success('Connexion rétablie !<br/>Bonne écoute sur Open-Dj');

				//force main overlay remove if still there
				self.toggleOverlay(true);

				//Removing disconnect special overlay
				self.disconnectOverlay = false;

				//Empty timeout spy
				self.reSyncPopup = undefined;

			}, 3000);

		};

	}]);

	app.controller('mainController', ['$scope', 'appGlobalWorkflow', function($scope, appGlobalWorkflow){
		$scope.appGlobalWorkflow = appGlobalWorkflow;
	}]);

})();