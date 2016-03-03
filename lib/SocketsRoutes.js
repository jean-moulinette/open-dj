module.exports = {

	/**
	 * [init socketRoutes]
	 * 
	 * @param  {[object]} io contient l'API des sockets [io instance]
	 * @param  {[object]} audioTools [Mon module audio ]
	 * @param  {[object]} VlcApi 	[Mon API Vlc node]
	 *
	 * @return {[undefined]}    [Stick sockets listeners in open-dj]
	 */
	init : function(io, audioTools, VlcApi){

		/**
		 *	Initialisation du serveur IO
		 *
		 *	Attachement des event listeners sur les connexions sockets
		 *
		 *	Event : Connection @return : { Obj } socket 
		 *	[L'objet représentant une connection bidirectionnelle établie entre la machine cliente et le serveur node.]
		 *
		 **/
		io.sockets.on('connection', function(socket){

			//Commande IO init de la connection bidrectionelle avec le client
			socket.on('new_user', function(){

				console.log('\n Un visiteur vient de se connecter.\n');

				socket.emit('announcement', 'Bienvenue sur Open-Dj !');

			});

			//Commande IO de resynchronisation avec le client lorsque la liaison IO à pété
			socket.on('reSyncUser', function(reSyncObject){

				//On va resynchroniser la valeur du volume sur l'affichage du client
				socket.emit('volume-value', serverGlobal.VlcApi.volumePercentVal);
			
			});

			//Commande IO de réglage du volume de diffusion de la musique
			socket.on('modifyVolume', function(data){
				VlcApi.volume(data);
			});

			//Commande IO de mise en pause de la lecture
			socket.on('pause', function(){
				VlcApi.pause();
			});

			//Commande IO de remise en marche de la lecture
			socket.on('resume', function(data){
				VlcApi.play(data);
			});


			//Routes de monitoring des globales
			socket.on('ask-server', function(){

				console.log('serverGlobal :\n');

				console.log('on :'+serverGlobal.on+'\n');
				console.log('downloading :'+serverGlobal.downloading+'\n');
				console.log('musicTitle :'+serverGlobal.musicTitle+'\n');
				console.log('paused :'+serverGlobal.paused+'\n');
				console.log('songId :'+serverGlobal.songId+'\n');
				
				console.log('Playlist:');

				for(var item in serverPlaylist){
					
					console.log('item:');

					console.log(item);

					for(var itemAttr in serverPlaylist[item]){
						console.log(serverPlaylist[item][itemAttr]);
					}

				}

			});

		});

	},

};