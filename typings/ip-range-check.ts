declare module "ip-range-check" {
	function check(address: string, range: Array<string> | string): Boolean;
	export = check;
}

