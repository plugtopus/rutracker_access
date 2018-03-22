class Proxy
{
	constructor() {
		this.rules = [];
	}

	buildRule(item, isFirst){
		return `${!isFirst?`else `:``}if(${item.exp}){ return "${this.resolveHost[(item.srv)]}"; }`;
	}

	addRule(exp, srv = 'reserved_nl2') {
		this.rules.push({exp, srv});
		return this;
	}

	resolveTo(host) {
		this.resolveHost = host;
		return this;
	}

	buildPacScript(cb) {
		var s = [`function FindProxyForURL(url, host){`];
		var self = this;

		this.rules.forEach(
			(item, id) => s.push(self.buildRule(item, id===0))
		);

		s.push(' else { return "DIRECT"; } }');

		return cb(s.join(' '));
	}
}

var prxy = new Proxy();
App.domains.forEach(item => prxy.addRule(`shExpMatch(url, "*${item}*")`));
chrome['proxy']['settings'].clear({ scope: "regular" });

prxy.resolveTo(App.servers).buildPacScript((data) => {
	chrome['proxy']['settings'].set({value: {mode: "pac_script", pacScript: {data: data}}, scope:"regular"})
});
