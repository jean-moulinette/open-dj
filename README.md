## Synopsis

A simple personnal DIY node.js server which aim to make your local speakers accessible from web clients.

Please note that this project is for fun and learning, nothing serious.

## OS Support

No windows

Gnu/Linux only, debian & his forks only as far as i tested it

Screw you Apple

## Dependencies
  
nodejs V0.7+ & npm (node package manager) 
visit https://github.com/joyent/node for more infos & guides


VLC 2 (VideoLan) Debian release

The best way to get vlc working well with open-dj is to install all vlc debian packages.
The following steps worked like a charm for me on Debian 7.5 Wheezy using apt package manager.

First, if VLC is already installed on your system, you must remove it properly like this. 

---------------------------------------------------

    sudo apt-get remove --purge vlc*

---------------------------------------------------

Then you can proceed to the installation

---------------------------------------------------

    sudo apt-get update
 
    sudo apt-get upgrade

    sudo apt-get install vlc*

---------------------------------------------------

Don't forget to add the asterisk in the install apt statement, it will get you all the VLC plugins.

Now you're ready to install open-dj.

## Installation

clone from github servers:

---------------------------------------------------

    cd /home/web/[whatever]
 
    git clone https://github.com/Fanghornn/open-dj.git

---------------------------------------------------

Installing npm dependencies:
  
----------------------------------------------------
    
    sudo npm install
    
----------------------------------------------------

Now that you have cloned the repo and installed npm dependencies, 

you must edit the file "open-dj-conf.js" using nano or whatever.

---------------------------------------------------

    config.host "set local ip or dns of the server running open-dj"
    
    config.port "set port"

---------------------------------------------------
  
This step is very important, if you fail at it, the socketIO server won't understand how to link clients with the distant websocket server.

Running the app:

----------------------------------------------------

    node app.js

----------------------------------------------------

## Debug & logs

The main node's process's stdout will print various logs about the path that scripts are running through when users are triggering socket events.

## Videos not working issue

Please note that you won't be able to play any video protected by Youtube and Copyrights as long as Vlc can't bypass this.

This can be very frustrating but there is many songs that aren't protected even if they should have been.

However, this can be a great opportunity to search and listening to creative contents.

#### Have fun

## Author

Jean Baptiste Priam Massat (Aka Fanghornn)

## Contributors

Wind blows

## License

GPL V2