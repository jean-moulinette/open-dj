function init(app, config){

	//Main route
	app.get('/', function (req, res) {
		
		//On injecte la valeur du volume Vlc dans l'attribut volume de l'objet param pour ejs
		config.volume = serverGlobal.VlcApi.volumePercentVal;

		res.render('index.ejs', config);

	});
	
}

exports.initRoutes = function(app, config){
	init(app, config);
};