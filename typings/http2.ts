/// <reference path="node/node.d.ts" />

declare module "http2" {
	import http = require('http');
	export function createServer(config: any, requestListener?: (request: http.IncomingMessage, response: http.ServerResponse) =>void ): http.Server;
}


