var socket = io.connect('192.168.1.86:1337');

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

	$(garbageDom).find('.yt-lockup').each(function(index){

		$(this).find('button').each(function(){
			$(this).remove();
		});

		var linkImage = $(this).find('.yt-lockup-thumbnail');

		//Forcer le chargement de l'image pour le client
		if(index > 5){

			var imgForcedSrc = forceImageDisplay(linkImage);

			if(imgForcedSrc !== false){
				//Remplacement de l'image caché par l'image forcée
				$(linkImage).find('img').attr('src', imgForcedSrc);

			}
		}

		//On reparse l'objet jquery en html après le traitement de l'image
		linkImage = $(linkImage).html();

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

/**
 *	forceImageDisplay
 *
 *	Fonction de gruge pour forcer les images supérieure à 5 resultats à s'afficher 
 *	Parceque youtube les affiche uniquement via un script un js quand l'utilisateur
 *	scroll dans la zone ou se trouve l'image
 *
 *	@param: {Jquery object} - le set d'élements qui contient la balise img
 *
 *	@return: {mixed} - false si echec/Un string avec le nouveau src en cas de réussite 
 */
function forceImageDisplay(videoBlock){

	var imgTag = $(videoBlock).find('img');

	var imgSrcInfo = $(imgTag).attr('src').split('.');

	var ext = imgSrcInfo[(imgSrcInfo.length - 1)];

	//Si l'image n'est pas chargé, le src contient un gif de 1 pixel
	if(ext === 'gif'){

		//Je remplace le src par la chaine contenue dans data-thumb qui contient le path
		return $(imgTag).data('thumb');
	}else{
		return false;
	}

}