var socket = io.connect('localhost:1337');

socket.on('connect', function(data){
	socket.emit('screen');
});

socket.on('yt-result', function(data){

	//Filtrage de la réponse pour ne ressorir uniquement les élements intéréssants
	data = getHtmlResult(data);

	$('#search-yt-results').html(data);

	$('a').click(function(){

		if(typeof this.href.split('v=')[1] == 'undefined'){
			alert('On dirais que t\'as choisis autre chose qu\'une video(chaine youtube ou autre), ça va pas marcher :(\nEssayes encore =D');
			return;
		}

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

/**
 *	getHtmlResult
 *
 *	@param: { string } - Le code html renvoyé par le serveur node
 *
 *	@return: { string } - Le code HTML de la réponse épurée
 */
function getHtmlResult(data){

	var htmlNinja = '';

	var garbageDom = $.parseHTML(data);

	$(garbageDom).find('.yt-lockup').each(function(){

		$(this).find('button').each(function(){
			$(this).remove();
		});

		var linkImage = $(this).find('.yt-lockup-thumbnail').html();
		var title = $(this).find('.yt-lockup-content').find('a').html();
		
		var singleResult = linkImage+title+'<br/><br/><br/>';

		htmlNinja += singleResult;
	});

	return htmlNinja;
}

/**
 *	launchYtSearch
 *
 *	Fonction appellé au clic sur le bouton de recherche
 */
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