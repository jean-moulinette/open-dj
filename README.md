## Synopsis

A simple personnal DIY node.js server which aim to make your local speakers accessible from web clients.

Please note that this project is for fun and learning, nothing serious.

## OS Support

No windows

Gnu/Linux only, debian & his forks only as far as i tested it

Screw you Apple

## Dependencies
  
Youtube-dl:
  
---------------------------------------------------

    sudo curl https://yt-dl.org/latest/youtube-dl -o /usr/local/bin/youtube-dl
    sudo chmod a+x /usr/local/bin/youtube-dl

---------------------------------------------------

If you do not have curl, you can alternatively use a recent wget:

    sudo wget https://yt-dl.org/downloads/latest/youtube-dl -O /usr/local/bin/youtube-dl
    sudo chmod a+x /usr/local/bin/youtube-dl

---------------------------------------------------

see https://github.com/rg3/youtube-dl/ for more infos
  
  
Python version 2.6, 2.7, or 3.2
  
  
nodejs V0.7+ & npm (node package manager) 
visit https://github.com/joyent/node for more infos & guides


## Installation

clone from github servers:

---------------------------------------------------

    cd /home/web/[whatever]
 
    git clone https://github.com/Fanghornn/open-dj.git

---------------------------------------------------

Setting the server's local ip adress in the client script:

---------------------------------------------------

    public/js/SocketManager.js 
    
    Where the io.connect('local ip adresse'); statement is.

---------------------------------------------------
  
Installing npm dependencies:
  
----------------------------------------------------
    
    sudo npm install
    
----------------------------------------------------


Running the app:

----------------------------------------------------

    node app.js

----------------------------------------------------

## Tests & logs

Two logs files are feeded when the app is running ("downloaded/log_play.log" and "downloaded/log_dl.log")

The main node's process's stdout will print various logs about the path that scripts are running through when users are triggering socket events.


## Author

Jean Baptiste Priam Massat (Aka Fanghornn)

## Contributors

Wind blows

## License

GPL V2

