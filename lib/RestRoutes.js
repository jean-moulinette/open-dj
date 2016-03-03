/**
 * [initApiRoutes description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
function initApiRoutes(app, audioTools, VlcApi){

	//Searching youtubes videos
	app.get('/api/yt-search/:searchPattern/:pageNumber', function(req, res){

		//Will return a JSON string to the response
		audioTools.searchVideo(req, res);

	});

	//Playing média on server
	app.post('/api/play-song', function(req, res){

		var result;

		console.log('\nDemande de lecture reçue par le client, titre : '+req.body.title+'\n');

		//If a song is already playing on the server and the song hasn't been forced to play
		if(serverGlobal.on && !req.body.force){
			
			console.log(req.body);
			//End the request and send back the song object
			result = req.body;

		}else{

			//else, launch the song throughout the VLC API
			VlcApi.playSound(req.body);

			//the result will be empty
			result = {};

		}

		res.status(202).send(JSON.stringify(result));

	});

}

exports.initRestApi = function(app, audioTools, VlcApi){
	initApiRoutes(app, audioTools, VlcApi);
};