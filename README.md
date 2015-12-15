## Synopsis

A simple personal DIY node.js server which aim to make your local speakers accessible from web clients.

Please note that this project is for fun and learning, nothing serious.

![open-dj_preview](http://i.imgur.com/ZfyUTZo.png)
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

First of all, if VLC is already installed on your system, you must remove it properly like this. 

---------------------------------------------------

    sudo apt-get remove --purge vlc*

---------------------------------------------------

Then you can proceed to the installation

---------------------------------------------------

    sudo apt-get update
 
    sudo apt-get upgrade

    sudo apt-get install vlc*

---------------------------------------------------

Don't forget to add the asterisk in the install apt statement, it will get you all VLC's plugins.

## VLC's youtube.lua script

**It is also very recommended to update the internal VLC youtube .lua script by replacing it with this one.**
https://raw.githubusercontent.com/videolan/vlc/master/share/lua/playlist/youtube.lua

Save it to your system (right click, save under), and replace the original one which is mostly located under **/usr/lib/vlc/lua/playlist** directory.

If you don't do this, you'll may go through serious issues when reading a youtube link with VLC, such as always getting a copyrights warning in open-dj. 

Now you're ready to install open-dj.

## Using an HTTP server

I personally use Nginx to host open-dj, this is very useful as i can set a reverse proxy on the port used by open-dj
redirecting it to the port 80 allowing your users to just type the ip/dns of your server in their favourite browser address bar without specifying any port.

You can find a file named **nginx.conf.exemple** at the root of the repo which will give you examples.
There is a few very important settings for getting open-dj's websocket server working well.

You can refer to http://nginx.org/en/docs/ for further informations.

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

    config.host = "set local ip or dns of the server running open-dj"
    
    config.port = "set port" (Only if you're not using a reverse proxy like mentioned above)

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

However, this can be a great opportunity to search and listen to creative contents.

**If you can't get a single video working well, this may be caused of an issue with youtube.lua VLC's script, _please refer to the section "VLC's youtube.lua script" in this document._**

#### Have fun

## Author

Jean Baptiste Priam Massat (Aka Fanghornn)

## Contributors

Wind blows

## License

GPL V2
