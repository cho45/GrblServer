GrblServer
==========

<img src="https://lh3.googleusercontent.com/9ZatDDCystwWiDAUMLOu9BrJ2OLjuJfO8MLFac0pt2ak7Luc84IDwXij0uzyNlvSsfmFFh368HVDTxjMjsXnYzTEDILlPdl3c2rIMqagHqcVgK3vbdiy3HGOMb50ekxMIr5JD1pc7gChlRMdjwjo0ceBo4BJjE554q7gBF6-SQjlJl37L-13wXBje_5HCVnXUZ8izFKIFiEFBZCc1zjq9eVEJrv5jcGPvPxUZJ1Pfh3wUFJmXmMOV13Sr-esqWaY-TLe57lnLBp6MPUPWAZq1cecml8h9DJv5v48XNXvz49giw36nL_rzIGGhx4jdtQD9H4FolBR781mUNJH-BeL1UV-HFvTI4wk1tFjmwQG4ayoijxxUCgVhUb6AwJV9OwkA1t7zzlthKLlXUmLSmuPraF2nwOAd9IxCCB8ZrvFqb6X9OTgUTnIe6RuVAzrk4FHoHiS67GlJBcbc8HIE-mBTdV2Xo5B7MEOPobs8TxdtfYB4qTafAKipvWuhQ1HVtAR-UQpXg_c3hFZ-AYuP89uqDHNjYtYuqBEck2_H5EX9PFw=w800-h349-no"/>

GrblServer is a <a href="https://github.com/grbl/grbl">Grbl</a> interface for standalone gcode execute service which works with nodejs.

GrblServer provides:

 * WebSocket APIs
 * Multiple session for one Grbl (broadcast Grbl state to all clients)
   This is useful for show state in multiple view (eg. local LCD and remote browsers)

Overview
========

## Standalone WebApp

By "Add to Home screen" feature on Chrome for Android.

<img src="https://lh3.googleusercontent.com/XUN3jJzqW5kaP0xyiYAZbrRouzaMzA_31gjNfJninLPmvH_CDKqSf4Txh-BGyHBIBwwJgFzlwd6Y7p5QEokZkGffIsiArIVbZHLB5T1CYy4XmqBTvQI3bBYbvzYUnhrn6t7qFEeLM1FX5qTLzBJS4htZQiOkpo0qAt8zA3JknPLdAMMKJWh1j6cwZiYlZ4Ax5o60tCtDAbyJ6wCSgXxuPmrnP2ip7dxljhL3elLUsRBDZxsmctd3ZXRLwYuw5UTf6cyZJ0tq5DAF2gaGCCeeCk0vNF0oW0NHhcnQkiFQaZgUvOmqolMTpPTF8Xzfj0kj5edDWiBjM72cbXjHAccXUR6Ex7WE-uwZOXK2KiHZfW1GtOGv2zdGeep60Dg0On8jWhv0KeOIwFopVUnmyIoSwsUVsGLOkqWP3XbPylHko67Nf3IGEo_DzLl_TfVkC2Id6hASXUVlizJf_99nU1063HoI6_BoeeIglVMgKve0We78TUYp3zJZ3jJvxi_9lug1_P0tlryRYEH2yjpxV92Ml98OEwLNUxde2X-_vdU-rXpd=w180-h320-no"/>
<img src="https://lh3.googleusercontent.com/nqSoaoOqGLV56d1-9CH7hiRFp0P-AhCyFcK81CKsNyf6vYYXdql0tMOOrgcmvQe7IWAiD8tUhJUc40lqpdIqdW-S7R5sU3jnzzV4uSNKi4YI67i95-y9zTNUWOyjGY9DURJn-Fc9R9jAdwWY3qYr4V4b-7kas7PJwDrdfeJDIUHmQQf1d913XhurslPxtSst41qkpMY7mJc78-pqzAdRdN2Xits5PeDs4DedWLplxRCtLN3dnhBBU3M6CoSuyeNR3iL2VXTWFh5sg93s3fquB_gIrIlIFcacBDrAiNNVlTsHV10bw3AX3C0u-C8zX8xjwVkCWYbkhPFEhI_d7gBvfhusfRkcg1Xy2XcMaz60CfT1Q7F6s6Tjw6HIH8RWk0mJYgP9BjGb1n-oZY1yoaoRom7A3xNbybw2t3KB2H5zRYKcYM5z8zuJpb_5WytgbKUKjBr0SxrOwPTk1eus4rFdebcK-r_euoFhgKbtQlM2jOO-En_j8958AlOwpiqVJ8Y70LMxiCenMgxseq6-KW3YGrchKKETOXIxk9H7xoBCJJFd=w182-h324-no"/>
<img src="https://lh3.googleusercontent.com/us6nR6693yLsQiMzpqdkV49-oD7n1EvRXGGmGCfsV5C_JVj1hCt9U6egje9-LXGuJ6W1getgM5dMCERn_zCmuEo-wIz652T59YnBNzhUTvr_LmdoEFU-MjOqaEFs8IWDS9wGiukUlBMi8C2yY0TokoiUqq6zR1Envj64Dsy5IrvWybZMssJv2ANW7pKCoJeHZX_Dr1ipdK0mvm5D7EGxzJW1JvvfWLB-CYO6LPKbIr0O5Xp5W0gF4cMRGJTLDMbHuAqwVMkUkhjMaK3FqZT0GNW84K-6r_D9iePZaSqevBrDmLP4mxkIeRk_AP8ppjy94kVaYH7Cfl2mYiy8ln0ivaCUAYLMIbrxvH2gNGvQTcd4qFm2Ew8LGZlcocUHIwJbWSwO07hxPu0Tibg5TFlrlWc9CGS6b7CoJcKf6KALCTSPQxSIag8qteKcbvszZaD1y6uSH-MwlgRVBtVk_f1uoLMl78qIKXqcq0JJjcID3Jc_F-CLuw-mXoxFQDYDTIvRmPY_teYxdrkYZh1rQRtWmifUx8btn8OoCeiT07lWpaD3=w182-h324-no"/>

## Responsive View

<img src="https://lh3.googleusercontent.com/IZetcFfVOfvXTHp9Ts7Eda8t7nXbHGRZCzmwQw7egp2YhBRVeXAOAoTBOaE9a5ffiTfSSFLRD3DtgZJ8yWXpRN_o-b7BS8DToYXZRP3BlcIIICbAUPmkTDy-I5O7iaP2UUouJ3qhh7aVjbWV2qONrE8z1cVt17YnhcfyqhOtr1qooRqnNun9aDpm4bD25GA3Aca1nIurT0qy20j5AHVvsTU4CqoNj5h3uNFf4Jh3d59ey5p7IRZ-5sj3YtAP_HHJ86ogsngcPTjisUWRBfALsO7XDSOKHoCHeY3YKk3BdJRwlJKCGzjjGSybHSrP_HU5WNbxEiLk1RyKOMPfNX_3tBIO1MLpm0m-mjdH51X-FiBwL_Wwg1z1tLRQWEAUgqWRDKl9KzOGMdpffNFc4fYIpMfPTGL_xc8bFOG8gXzizE1CPWNMRYsJj6WppfypUdCUJZMxRMX6dwfSrv8NO9rSjeWkGP9XfTXVEPpa52aBlldRY1cmHAr2cMY4yFdx_UBBPylu1V955Y8OKyHd_2L8KODEfYBMTWm3imAB4dCKnfeY=w1522-h947-no"/>

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

### `TLSKey`, `TLSCert`

Specify TLS key/cert for HTTP2. Default is empty (disabled).

GrblServer includes `localhost` cert (self signed certificates). Use it by following:

	"TLSKey" : "dev/server.key",
	"TLSCert" : "dev/server.crt" 

Or create self signed certificates by `dev/make-key.sh`.

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
	make watch # tsc watch
	make server # launch websocket/http server

browser client is written JavaScript with Polymer

Above `make server` also serves static files under `browser/`.

## Grbl for development

You may need actual connection to Grbl. But you should not connect to Grbl which connected to powered CNC machine. So I suggest you to make another Grbl installed Arduino and use it for development.

Grbl is open-loop control except homing and probing. It means you don't need to connect actual CNC machine in most case.

Contribute
==========

Send pull-request.
	
LICENSE
=======

MIT: http://cho45.github.com/mit-license
