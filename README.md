GrblServer
==========

GrblServer is a Grbl interface for standalone gcode execute service which works with nodejs.

GrblServer provides:

 * WebSocket APIs
 * Multiple session for one Grbl (broadcast Grbl state to all clients)
   This is useful for show state in multiple view (eg. local LCD and remote browsers)

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
