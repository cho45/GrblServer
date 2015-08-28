GrblServer
==========

<img src="https://lh3.googleusercontent.com/iXY6JkBejdJkOzSoXMgJMYrVHPCVLNvBcH724zil-8iW=w548-h219-no"/>

GrblServer is a <a href="https://github.com/grbl/grbl">Grbl</a> interface for standalone gcode execute service which works with nodejs.

GrblServer provides:

 * WebSocket APIs
 * Multiple session for one Grbl (broadcast Grbl state to all clients)
   This is useful for show state in multiple view (eg. local LCD and remote browsers)

Install & Basic Usage
===============

You must install <a href="https://nodejs.org/">node.js</a> and <a href="https://help.github.com/articles/set-up-git/">git</a>.

### Clone repository to local

	git clone https://github.com/cho45/GrblServer.git

### Install dependencies

	cd GrblServer
	npm install

### Configure

Create config/local.json. You must edit "serialPort" path.

	cp config/default.json config/local.json
	vi config/local.json

### Run GrblServer

You should connect Grbl installed Arduino before running.

	node out/server.js

### Open client by browser

Google Chrome is recommended for performance.

	open http://localhost:8080/

(GrblServer also serves static files under ./browser)


Configuration
=============

### `serverPort`

Specify WebSocket/HTTP server port to serve.

### `serialPort`

Specify serial port path which is connected to Grbl.

### `serialBaud`

Specify serial baudrate to Grbl.

You want to write configuration with other formats? You can:
https://github.com/lorenwest/node-config/wiki/Configuration-Files

Usecases
========

<img src="https://lh3.googleusercontent.com/3uEf2lgkteAVTf_Vq4pHyrlFeO1XroKayb335uWXJBzR=w255-h382-no"/>
Jogging by smartphone's browser

## with Raspberry Pi

### Setup

Ensure that NodeJS has been installed on the Rapsberry Pi (https://learn.adafruit.com/node-embedded-development/installing-node-dot-js)

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


Development
===========

GrblServer is written in TypeScript.

	sudo npm install -g typescript
	npm install
	make watch


browser client is written JavaScript with Polymer

	cd browser/
	
LICENSE
=======

MIT: http://cho45.github.com/mit-license
