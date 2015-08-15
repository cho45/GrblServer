#!/bin/sh

echo "Executing service..."

set -x

cd /home/pi/app/GrblServer
while :
do
	git pull
	node out/server.js
	sleep 10
done

