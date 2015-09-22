#!/bin/sh

cd dev

CN=localhost

openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/C=JP/ST=Kyoto/L=Kyoto/O=Example/CN=$CN"
openssl x509 -req -days 1024 -in server.csr -signkey server.key -out server.crt
rm server.csr

