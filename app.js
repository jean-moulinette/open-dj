/**
 *	Initialisation des lib du serveur
 */
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	path = require('path');
	logger = require('express-logger'),
	methodOverride = require('method-override'),
	io = require('socket.io').listen(server),
	spawn = require('child_process').spawn,
	omx = require('omxcontrol');

app.set('port', process.env.TEST_PORT || 80);

app.use(logger({path:'dev'}));

app.use(methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

//Module de controle de omxplayer, créé des route start/:filename pause quit 
app.use(omx());


//Routes
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

app.get('/remote', function (req, res) {
  res.sendfile(__dirname + '/public/remote.html');
});


var ss;

//Le serveur socket.io
io.sockets.on('connection', function(socket){
	
	//Socket screen
	socket.on('screen', function(data){
		
		socket.type = 'screen';

		//Garde en mémoire le socket screen
		ss = socket;
		console.log('Screen prêt...');
	});

	//Socket remote
	socket.on('remote', function(data){
		
		console.log('Remote prête...');
		
		socket.type = 'remote';

		if(ss !== undefined){
			console.log('Synchronisé');
		}

	});

	socket.on('yt-search', function(data){
		
		data = data.toLowerCase();

		data = data.replace(/ /g, '+');

		console.log(data);

		var requestTool = require('follow-redirects').http;

		var hostName = 'youtube.com';

		var requestOptions = {
			host: hostName,
			path:'/results?search_query='+data,
			port:'80'
		};

		var req = requestTool.request(requestOptions, function(requestResponse){

			var htmlResponse = '';
			
			var htmlNinja = '';

			requestResponse.setEncoding('utf8');

			requestResponse.on('data', function(chunk){
				htmlResponse += chunk;
			});

			requestResponse.on('end', function(){

				var env = require('jsdom').env;

				env(htmlResponse, function(errors, window){
					
					if(errors !== null){
						console.log(errors);
					}

					var $ = require('jquery')(window);
					
					var stylesNinja = '';

					htmlNinja += $('#results').html();

					socket.emit('yt-result', htmlNinja);

				});

			});

		});

		req.end();
	
	});

	//Actions de control
	socket.on('controll', function(data){
		console.log(data);

		if(socket.type === 'remote'){

			if(data.action === 'tap'){
				if(ss !== undefined){
					ss.emit('controlling', {action:'enter'});
				}
			}else if(data.action === 'swipeLeft'){
				if(ss !== undefined){
					ss.emit('controlling', {action:'goLeft'});
				}
			}else if(data.action === 'swipeRight'){
				if(ss !== undefined){
					ss.emit('controlling', {action:'goRight'});
				}
			}

		}

	});

	socket.on('video', function(data){

		if(data.action === 'play'){
			var id = data.video_id,
				url = 'http://www.youtube.com/watch?v='+id;
		}

		var runShell = new run_shell('youtube-dl',['-o','%(id)s.%(ext)s','-f','/18/22',url],
			
			function(me, buffer){
			
				me.stdout += buffer.toString();

				socket.emit('loading',{output: me.stdout});
			
				console.log('Recu fonction play \n envoi de l\'event socket \'loading\' \n '+me.stdout);
			},
			function(){
				//child = spawn('omxplayer', [id+'.mp4']);
				omx.start(id+'.mp4');
			});

	});





});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

function run_shell(cmd, args, cb, end){
	var spawn = require('child_process').spawn,
	child = spawn(cmd, args),
	me = this;

	child.stdout.on('data', function(buffer){
		cb(me, buffer);
	});

	child.stdout.on('end', end);
}