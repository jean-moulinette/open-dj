(function(){

	'use strict';

	var app = angular.module('playerWidget', []);

	app.factory('playerWidget', ['socket', function(socket){

		var playerWidget = {},
			tempConfigEl,
			volumeVal;

		//fetching server media player's volume value from config element
		tempConfigEl = $('#volume');
		volumeVal = tempConfigEl.data('volume');
		tempConfigEl.remove();

		//Listening our websocket server for a new volumeValue to set
		socket.on('volume-value', function(volumeValue){
			playerWidget.volumeVal = volumeValue;
		});

		/**
		 * [setVolume Click listener for setting volume]
		 * 
		 * @param {[string]} 		direction 	[up or down]
		 * @param {[Oject]} 		event     	[DOM Event]
		 *
		 * @return {[undefined]}]
		 */
		playerWidget.setVolume = function(direction, event){

			event.preventDefault();

			if ( direction === 'up' || direction === 'down' ){
				socket.emit('modifyVolume', direction);
			}

		};

		/**
		 * [resume Click listener for resuming song]
		 *
		 * @param {[Oject]} 		event     	[DOM Event]
		 * 
		 * @return {[undefined]}] 
		 */
		playerWidget.resume = function(event){
			event.preventDefault();
			socket.emit('resume');
		};

		/**
		 * [pause Click listener to pause song]
		 *
		 * @param {[Oject]} 		event     	[DOM Event]
		 * 
		 * @return {[undefined]}]
		 */
		playerWidget.pause = function(event){
			event.preventDefault();
			socket.emit('pause');
		};

		/**
		 * [switchTheme Listener for theme switch (light/dark)]
		 *
		 * @param {[Oject]} 		event     	[DOM Event]
		 * 
		 * @return {[undefined]}]
		 */
		playerWidget.toggleTheme = function(event){

			event.preventDefault();

			if(playerWidget.theme === 'light-theme'){
				playerWidget.theme = 'dark-theme';
			}else{
				playerWidget.theme = 'light-theme';
			}

		};

		//Default val on theme
		playerWidget.theme = 'light-theme';

		playerWidget.volumeVal = volumeVal;

		return playerWidget;
	
	}]);

	app.controller('playerWidgetCtrl', ['$scope', 'playerWidget', function($scope, playerWidget){

		//Mobile menu initialisation
		$(".button-collapse").sideNav();

		//Adding services to controller scope
		$scope.playerWidget = playerWidget;
	}]);

	app.directive('playerWidget', function(){
		return {
			controller: 'playerWidgetCtrl',
			restrict: 'E',
			templateUrl: '/templates/widgets/player-widget.html'
		};
	});

})();