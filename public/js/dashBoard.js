(function(){

	'use strict';

	var app = angular.module('dash-board', []);

	//We need a factory which will be used across the front-end via angular expressions or be called by menuButtons which will also be available in expressions
	app.factory('menuActions', function(){
		
		var menuActions = {};

		//When this attribute will be set to true, the dashboard will open, otherwise, it'll vanish
		menuActions.open = false;

		//The function that will invert the open value
		menuActions.launchMenu = function(){
				menuActions.open = !menuActions.open;
		};

		return menuActions;

	});

	//This factory will provide buttons objects which are also able to call some menuActions factory functions
	app.factory('menuButtons', function(menuActions){

		//Function to create a single button object
		var createButton = function(label, click, icon){
			return {
				label:label,
				click:click,
				icon:icon
			};
		};

		//Creating each buttons that we need
		var historiqueButton = createButton('Historique', '', 'date_range');
		var playlistsButton = createButton('Playlists', '', 'queue_music');
		var chatButton = createButton('chat', '', 'chat');
		var closeButton = createButton('Retour', menuActions.launchMenu, 'clear');

		return [
			historiqueButton,
			playlistsButton,
			chatButton,
			closeButton
		];

	});

	//The dashboardMenuCtrl will bind my factories to the DOM and the angular expressions scope
	app.controller('dashboardMenuCtrl', ['menuActions', 'menuButtons', '$scope', function(menuActions, menuButtons, $scope){

		//Adding my factories objects to the controller scope
		$scope.menuActions = menuActions;
		$scope.buttons = menuButtons;

	}]);

	//Creating our custom directive who contains our HTML template of the dashboard menu
	app.directive('dashBoardMenuPanel', function(){

		return{
			
			restrict:'E',
			
			templateUrl:'/menu-panel.html',

			controller:'dashboardMenuCtrl'

		};

	});

})();