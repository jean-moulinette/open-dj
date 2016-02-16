/**
 **************************************
 *	@author: Jean Baptiste Priam Massat
 *			 Aka Fanghornn
 *			 
 * 	@mail: jean.massat[at]gmail[dot]com
 *
 * 	@Project: A simple personnal DIY node.js server which aim to make your local speakers accessible from web clients.
 *
 *	@Copyright (c) <2014> <Jean Baptiste PRIAM MASSAT>
 *
 ************************************** 
 */

/*
		░░░░░░░░░░░░░ ▲ ░░░░░░░░░░░░
		░░░░░░░░░░░░ ▲ ▲ ░░░░░░░░░░░
		░░░░░░░░░░░ ▲ ▲ ▲ ░░░░░░░░░░
		░░░░░░░░░░ ▲ ▲ ▲ ▲ ░░░░░░░░░
		░░░░░░░░░ ▲ ▲ ▲ ▲ ▲ ░░░░░░░░
		░░░░░░░░ ▲ ▲ ▲ ▲ ▲ ▲ ░░░░░░░
		░░░░░░░ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ░░░░░░
		░░░░░░ ▲░░░░░░░░░░░░▲ ░░░░░░
		░░░░░ ▲ ▲░░░░░░░░░░▲ ▲ ░░░░░
		░░░░ ▲ ▲ ▲░░░░░░░░▲ ▲ ▲ ░░░░
		░░░ ▲ ▲ ▲ ▲░░░░░░▲ ▲ ▲ ▲ ░░░
		░░ ▲ ▲ ▲ ▲ ▲░░░░▲ ▲ ▲ ▲ ▲ ░░
		░ ▲ ▲ ▲ ▲ ▲ ▲░░▲ ▲ ▲ ▲ ▲ ▲ ░
		 ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲ ▲
		░░░░░▓▓░░░░░░░░░░░░▓▓░░░░░░░
		░░░░░▓▓▓░████████░▓▓▓░░░░░░░
		░░░░░▓▓░█▓▓▓▓▓▓▓▓█░▓▓░░░░░░░
		░░░░░▓▓░░░██░░██░░░▓▓░░░░░░░		
		░░░░░▓▓░░░▓▓░░▓▓░░░▓▓░░░░░░░			La triforce vaincra !
		░░░░░▓▓▓░░░░░░░░░░▓▓▓░░░░░░░		
		░░░░░▓▓▓██░░▓▓░░██▓▓▓░░░░░░░
		░░░░░░▓▓███░▓▓░███▓▓░░░░░░░░
		░░░░░░▓████████████▓░░░░░░░░
		░░░░░░░████████████░░░░░░░░░
		░░░░░░░████████████░░░░░░░░░
		░░░░░░░████▓▓▓▓████░░░░░░░░░
		░░░░░░░▓▓▓▓▓██▓▓▓▓▓░░░░░░░░░
		░░░░░░░████▓▓▓▓████░░░░░░░░░
		░░░░░░░████████████░░░░░░░░░
		░░░░░░░░▓▓▓░░░░▓▓▓░░░░░░░░░░
		░░░░░░░░▓▓▓░░░░▓▓▓░░░░░░░░░░
*/
var server = require('./lib/server.js'),
	config = require('./open-dj.conf.js');

//Gestion oublis de configuration
if( config.host === ''){
	throw '\nYou must edit the file "open-dj.conf.js" with your server\'s ip to get open-dj working \n';
}

process.title = 'open-dj';
server.start(config);