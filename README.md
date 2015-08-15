GrblServer
==========

<img src="https://lh3.googleusercontent.com/iXY6JkBejdJkOzSoXMgJMYrVHPCVLNvBcH724zil-8iW=w548-h219-no"/>

GrblServer is a Grbl interface for standalone gcode execute service which works with nodejs.

GrblServer provides:

 * WebSocket APIs
 * Multiple session for one Grbl (broadcast Grbl state to all clients)
   This is useful for show state in multiple view (eg. local LCD and remote browsers)

Usecases
========

<img src="https://lh3.googleusercontent.com/3uEf2lgkteAVTf_Vq4pHyrlFeO1XroKayb335uWXJBzR=w255-h382-no"/>
Jogging by smartphone's browser

## with Raspberry Pi

### Setup

Clone GrblServer on Raspberry Pi:

	mkdir app
	cd app
	git clone https://github.com/cho45/GrblServer.git
	cd GrblServer
	npm install
	vi config/local.json

Edit /etc/inittab to auto login by user pi:

	sudo vi /etc/inittab
	
	# comment out following line:
	# 1:2345:respawn:/sbin/getty --noclear 38400 tty1 
	# and add following line:
	1:2345:respawn:/bin/login -f pi tty1 </dev/tty1 >/dev/tty1 2>&1

Edit /etc/rc.local to auto launch GrblServer:

	sudo vi /etc/rc.local
	# add following line before exit
	sudo -u pi /home/pi/app/GrblServer/service/grbl-server.sh


Install & Usage
===============

	git clone https://github.com/cho45/GrblServer.git
	cd GrblServer
	npm install
	vi config/local.json
	node out/server.js

Configuration
=============

See Also: https://github.com/lorenwest/node-config/wiki/Configuration-Files

Development
===========

GrblServer is written in TypeScript.

	sudo npm install -g typescript
	npm install
	make watch


browser client is written JavaScript with Polymer

	cd browser/
