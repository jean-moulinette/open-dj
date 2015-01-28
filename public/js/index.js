var socket = io.connect('localhost');

socket.on('connect', function(data){
	socket.emit('screen');
});

socket.on('yt-result', function(data){

	$('#search-yt-results').html(data);
	
	$('a').click(function(){

		var sendRequestToRpi = {
			action: 'play',
			id: this.href.split('v=')[1]
		};

		if(sendRequestToRpi !== ''){
			socket.emit('video', sendRequestToRpi);

			alert('Enjoy');
		}
	});
});


$('#launch-search').click(launchYtSearch);

$('#launch-search').tap(launchYtSearch);

function launchYtSearch(){

	var inputVal = $('#yt-search').val();

	if(inputVal !== ''){
		socket.emit('yt-search', inputVal);
	}else{
		alert('Tu veux faire une recherche vide ...?');
		alert('Et bien ça marche pas avec moi !');
		alert('En plus je te fais chier avec des alertes LOL AHAHA JE ME MARRE TROP QUOI');
	}
}