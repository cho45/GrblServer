declare module "node-static" {
	export class Server {
		constructor(path: string, options?: any);
		serve(req: any, res: any);
	}
}


