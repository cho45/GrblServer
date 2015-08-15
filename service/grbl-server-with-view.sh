#!/bin/sh

echo "Executing service..."

set -x

cd /home/pi/app/GrblServer
node out/server.js > grblserver.log 2>&1 &
while :
do
	git pull
	node clients/raspi-view.js
	sleep 10
done

