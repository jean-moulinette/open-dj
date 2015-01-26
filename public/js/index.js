var socket = io.connect('localhost');

socket.on('connect', function(data){
	socket.emit('screen');
});

socket.on('yt-result', function(data){
	$('#search-yt-results').html(data);
});


$('#launch-search').click(launchYtSearch);

$('#launch-search').tap(launchYtSearch);

function launchYtSearch(){
	var inputVal = $('#yt-search').val();

	if(inputVal !== ''){
		socket.emit('yt-search', inputVal);
	}
}