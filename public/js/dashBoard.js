(function(){

	var app = angular.module('dash-board', []);

	//Creating a factory which will be provided as service to our dashboard menu controller
	app.factory('menuButtons', function(){

		//Function to create a single button object
		var createButton = function(libelle, click, icon){
			return {
				libelle:libelle,
				click:click,
				icon:icon
			};
		}

		//Creating each buttons that we need
		var historiqueButton = createButton('Historique', '', 'date_range');
		var playlistsButton = createButton('Playlists', '', 'queue_music');
		var chatButton = createButton('chat', '', 'chat');
		var closeButton = createButton('Retour', '', 'clear');

		return [
			historiqueButton,
			playlistsButton,
			chatButton,
			closeButton
		];

	});

	//The dashboard menu controller which will contains the buttons to open the dashboard applications
	//menuButtons is a service which will store buttons of the main menu
	app.controller('dashboardMenuCtrl', ['menuButtons', '$scope', function(menuButtons, $scope){

		$scope.buttons = menuButtons;

		$scope.closeMainMenu = function(){
			$scope.$emit('closeMenu');
		}

	}]);

	//Creating a controller to open/close the dashboard menu wich will be present in the whole DOM
	app.controller('toggleMenu', ['$scope', function($scope){
		
		$scope.open = false;

		$scope.$on('closeMenu', function(event){
			$scope.launchMenu();
		});
	
		//Invert the boolean value of $scope.open
		$scope.launchMenu = function(){
			$scope.open = !$scope.open;
		};

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