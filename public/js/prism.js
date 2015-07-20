/* http://prismjs.com/download.html?themes=prism-coy&languages=markup+css+clike+javascript+aspnet+bash+c+csharp+cpp+git+go+http+jade+java+makefile+markdown+perl+php+python+r+ruby+scala+sql+stylus */
var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function(){

// Private helper vars
var lang = /\blang(?:uage)?-(?!\*)(\w+)\b/i;

var _ = _self.Prism = {
	util: {
		encode: function (tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
			} else if (_.util.type(tokens) === 'Array') {
				return tokens.map(_.util.encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},

		type: function (o) {
			return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
		},

		// Deep clone a language definition (e.g. to extend it)
		clone: function (o) {
			var type = _.util.type(o);

			switch (type) {
				case 'Object':
					var clone = {};

					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = _.util.clone(o[key]);
						}
					}

					return clone;

				case 'Array':
					// Check for existence for IE8
					return o.map && o.map(function(v) { return _.util.clone(v); });
			}

			return o;
		}
	},

	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);

			for (var key in redef) {
				lang[key] = redef[key];
			}

			return lang;
		},

		/**
		 * Insert a token before another token in a language literal
		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
		 * we cannot just provide an object, we need anobject and a key.
		 * @param inside The key (or language id) of the parent
		 * @param before The key to insert before. If not provided, the function appends instead.
		 * @param insert Object with the key/value pairs to insert
		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
		 */
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];
			
			if (arguments.length == 2) {
				insert = arguments[1];
				
				for (var newToken in insert) {
					if (insert.hasOwnProperty(newToken)) {
						grammar[newToken] = insert[newToken];
					}
				}
				
				return grammar;
			}
			
			var ret = {};

			for (var token in grammar) {

				if (grammar.hasOwnProperty(token)) {

					if (token == before) {

						for (var newToken in insert) {

							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}

					ret[token] = grammar[token];
				}
			}
			
			// Update references in other language definitions
			_.languages.DFS(_.languages, function(key, value) {
				if (value === root[inside] && key != inside) {
					this[key] = ret;
				}
			});

			return root[inside] = ret;
		},

		// Traverse a language definition with Depth First Search
		DFS: function(o, callback, type) {
			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);

					if (_.util.type(o[i]) === 'Object') {
						_.languages.DFS(o[i], callback);
					}
					else if (_.util.type(o[i]) === 'Array') {
						_.languages.DFS(o[i], callback, i);
					}
				}
			}
		}
	},

	highlightAll: function(async, callback) {
		var elements = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code');

		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, callback);
		}
	},

	highlightElement: function(element, async, callback) {
		// Find language
		var language, grammar, parent = element;

		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}

		if (parent) {
			language = (parent.className.match(lang) || [,''])[1];
			grammar = _.languages[language];
		}

		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

		// Set language on the parent, for styling
		parent = element.parentNode;

		if (/pre/i.test(parent.nodeName)) {
			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
		}

		if (!grammar) {
			return;
		}

		var code = element.textContent;

		if(!code) {
			return;
		}

		code = code.replace(/^(?:\r?\n|\r)/,'');

		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};

		_.hooks.run('before-highlight', env);

		if (async && _self.Worker) {
			var worker = new Worker(_.filename);

			worker.onmessage = function(evt) {
				env.highlightedCode = Token.stringify(JSON.parse(evt.data), language);

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				callback && callback.call(env.element);
				_.hooks.run('after-highlight', env);
			};

			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code
			}));
		}
		else {
			env.highlightedCode = _.highlight(env.code, env.grammar, env.language);

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;

			callback && callback.call(element);

			_.hooks.run('after-highlight', env);
		}
	},

	highlight: function (text, grammar, language) {
		var tokens = _.tokenize(text, grammar);
		return Token.stringify(_.util.encode(tokens), language);
	},

	tokenize: function(text, grammar, language) {
		var Token = _.Token;

		var strarr = [text];

		var rest = grammar.rest;

		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}

			delete grammar.rest;
		}

		tokenloop: for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			var patterns = grammar[token];
			patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				var pattern = patterns[j],
					inside = pattern.inside,
					lookbehind = !!pattern.lookbehind,
					lookbehindLength = 0,
					alias = pattern.alias;

				pattern = pattern.pattern || pattern;

				for (var i=0; i<strarr.length; i++) { // Don’t cache length as it changes during the loop

					var str = strarr[i];

					if (strarr.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						break tokenloop;
					}

					if (str instanceof Token) {
						continue;
					}

					pattern.lastIndex = 0;

					var match = pattern.exec(str);

					if (match) {
						if(lookbehind) {
							lookbehindLength = match[1].length;
						}

						var from = match.index - 1 + lookbehindLength,
							match = match[0].slice(lookbehindLength),
							len = match.length,
							to = from + len,
							before = str.slice(0, from + 1),
							after = str.slice(to + 1);

						var args = [i, 1];

						if (before) {
							args.push(before);
						}

						var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias);

						args.push(wrapped);

						if (after) {
							args.push(after);
						}

						Array.prototype.splice.apply(strarr, args);
					}
				}
			}
		}

		return strarr;
	},

	hooks: {
		all: {},

		add: function (name, callback) {
			var hooks = _.hooks.all;

			hooks[name] = hooks[name] || [];

			hooks[name].push(callback);
		},

		run: function (name, env) {
			var callbacks = _.hooks.all[name];

			if (!callbacks || !callbacks.length) {
				return;
			}

			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	}
};

var Token = _.Token = function(type, content, alias) {
	this.type = type;
	this.content = content;
	this.alias = alias;
};

Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}

	if (_.util.type(o) === 'Array') {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}

	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};

	if (env.type == 'comment') {
		env.attributes['spellcheck'] = 'true';
	}

	if (o.alias) {
		var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
		Array.prototype.push.apply(env.classes, aliases);
	}

	_.hooks.run('wrap', env);

	var attributes = '';

	for (var name in env.attributes) {
		attributes += name + '="' + (env.attributes[name] || '') + '"';
	}

	return '<' + env.tag + ' class="' + env.classes.join(' ') + '" ' + attributes + '>' + env.content + '</' + env.tag + '>';

};

if (!_self.document) {
	if (!_self.addEventListener) {
		// in Node.js
		return _self.Prism;
	}
 	// In worker
	_self.addEventListener('message', function(evt) {
		var message = JSON.parse(evt.data),
		    lang = message.language,
		    code = message.code;

		_self.postMessage(JSON.stringify(_.util.encode(_.tokenize(code, _.languages[lang]))));
		_self.close();
	}, false);

	return _self.Prism;
}

// Get current script and highlight
var script = document.getElementsByTagName('script');

script = script[script.length - 1];

if (script) {
	_.filename = script.src;

	if (document.addEventListener && !script.hasAttribute('data-manual')) {
		document.addEventListener('DOMContentLoaded', _.highlightAll);
	}
}

return _self.Prism;

})();

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism;
}
;
Prism.languages.markup = {
	'comment': /<!--[\w\W]*?-->/,
	'prolog': /<\?[\w\W]+?\?>/,
	'doctype': /<!DOCTYPE[\w\W]+?>/,
	'cdata': /<!\[CDATA\[[\w\W]*?]]>/i,
	'tag': {
		pattern: /<\/?[^\s>\/]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,
				inside: {
					'punctuation': /[=>"']/
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});
;
Prism.languages.css = {
	'comment': /\/\*[\w\W]*?\*\//,
	'atrule': {
		pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
		inside: {
			'rule': /@[\w-]+/
			// See rest below
		}
	},
	'url': /url\((?:(["'])(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
	'selector': /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
	'string': /("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/,
	'property': /(\b|\B)[\w-]+(?=\s*:)/i,
	'important': /\B!important\b/i,
	'function': /[-a-z0-9]+(?=\()/i,
	'punctuation': /[(){};:]/
};

Prism.languages.css['atrule'].inside.rest = Prism.util.clone(Prism.languages.css);

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /<style[\w\W]*?>[\w\W]*?<\/style>/i,
			inside: {
				'tag': {
					pattern: /<style[\w\W]*?>|<\/style>/i,
					inside: Prism.languages.markup.tag.inside
				},
				rest: Prism.languages.css
			},
			alias: 'language-css'
		}
	});
	
	Prism.languages.insertBefore('inside', 'attr-value', {
		'style-attr': {
			pattern: /\s*style=("|').*?\1/i,
			inside: {
				'attr-name': {
					pattern: /^\s*style/i,
					inside: Prism.languages.markup.tag.inside
				},
				'punctuation': /^\s*=\s*['"]|['"]\s*$/,
				'attr-value': {
					pattern: /.+/i,
					inside: Prism.languages.css
				}
			},
			alias: 'language-css'
		}
	}, Prism.languages.markup.tag);
};
Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true
		}
	],
	'string': /("|')(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
	'class-name': {
		pattern: /((?:(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /(\.|\\)/
		}
	},
	'keyword': /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(true|false)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'number': /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/,
	'operator': /[-+]{1,2}|!|<=?|>=?|={1,3}|&{1,2}|\|?\||\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};
;
Prism.languages.javascript = Prism.languages.extend('clike', {
	'keyword': /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield)\b/,
	'number': /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
	'function': /(?!\d)[a-z0-9_$]+(?=\()/i
});

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
		lookbehind: true
	}
});

Prism.languages.insertBefore('javascript', 'class-name', {
	'template-string': {
		pattern: /`(?:\\`|\\?[^`])*`/,
		inside: {
			'interpolation': {
				pattern: /\$\{[^}]+\}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation'
					},
					rest: Prism.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	}
});

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /<script[\w\W]*?>[\w\W]*?<\/script>/i,
			inside: {
				'tag': {
					pattern: /<script[\w\W]*?>|<\/script>/i,
					inside: Prism.languages.markup.tag.inside
				},
				rest: Prism.languages.javascript
			},
			alias: 'language-javascript'
		}
	});
}
;
Prism.languages.aspnet = Prism.languages.extend('markup', {
	'page-directive tag': {
		pattern: /<%\s*@.*%>/i,
		inside: {
			'page-directive tag': /<%\s*@\s*(?:Assembly|Control|Implements|Import|Master(?:Type)?|OutputCache|Page|PreviousPageType|Reference|Register)?|%>/i,
			rest: Prism.languages.markup.tag.inside
		}
	},
	'directive tag': {
		pattern: /<%.*%>/i,
		inside: {
			'directive tag': /<%\s*?[$=%#:]{0,2}|%>/i,
			rest: Prism.languages.csharp
		}
	}
});
// Regexp copied from prism-markup, with a negative look-ahead added
Prism.languages.aspnet.tag.pattern = /<(?!%)\/?[^\s>\/]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i;

// match directives of attribute value foo="<% Bar %>"
Prism.languages.insertBefore('inside', 'punctuation', {
	'directive tag': Prism.languages.aspnet['directive tag']
}, Prism.languages.aspnet.tag.inside["attr-value"]);

Prism.languages.insertBefore('aspnet', 'comment', {
	'asp comment': /<%--[\w\W]*?--%>/
});

// script runat="server" contains csharp, not javascript
Prism.languages.insertBefore('aspnet', Prism.languages.javascript ? 'script' : 'tag', {
	'asp script': {
		pattern: /<script(?=.*runat=['"]?server['"]?)[\w\W]*?>[\w\W]*?<\/script>/i,
		inside: {
			tag: {
				pattern: /<\/?script\s*(?:\s+[\w:-]+(?:=(?:("|')(\\?[\w\W])*?\1|\w+))?\s*)*\/?>/i,
				inside: Prism.languages.aspnet.tag.inside
			},
			rest: Prism.languages.csharp || {}
		}
	}
});

// Hacks to fix eager tag matching finishing too early: <script src="<% Foo.Bar %>"> => <script src="<% Foo.Bar %>
if ( Prism.languages.aspnet.style ) {
	Prism.languages.aspnet.style.inside.tag.pattern = /<\/?style\s*(?:\s+[\w:-]+(?:=(?:("|')(\\?[\w\W])*?\1|\w+))?\s*)*\/?>/i;
	Prism.languages.aspnet.style.inside.tag.inside = Prism.languages.aspnet.tag.inside;
}
if ( Prism.languages.aspnet.script ) {
	Prism.languages.aspnet.script.inside.tag.pattern = Prism.languages.aspnet['asp script'].inside.tag.pattern;
	Prism.languages.aspnet.script.inside.tag.inside = Prism.languages.aspnet.tag.inside;
};
Prism.languages.bash = Prism.languages.extend('clike', {
	'comment': {
		pattern: /(^|[^"{\\])#.*/,
		lookbehind: true
	},
	'string': {
		//allow multiline string
		pattern: /("|')(\\?[\s\S])*?\1/,
		inside: {
			//'property' class reused for bash variables
			'property': /\$([a-zA-Z0-9_#\?\-\*!@]+|\{[^\}]+\})/
		}
	},
	// Redefined to prevent highlighting of numbers in filenames
	'number': {
		pattern: /([^\w\.])-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/,
		lookbehind: true
	},
	// Originally based on http://ss64.com/bash/
	'function': /\b(?:alias|apropos|apt-get|aptitude|aspell|awk|basename|bash|bc|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chmod|chown|chroot|chkconfig|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|cut|date|dc|dd|ddrescue|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|enable|env|ethtool|eval|exec|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|grep|groupadd|groupdel|groupmod|groups|gzip|hash|head|help|hg|history|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|jobs|join|kill|killall|less|link|ln|locate|logname|logout|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|make|man|mkdir|mkfifo|mkisofs|mknod|more|most|mount|mtools|mtr|mv|mmv|nano|netstat|nice|nl|nohup|notify-send|nslookup|open|op|passwd|paste|pathchk|ping|pkill|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|rename|renice|remsync|rev|rm|rmdir|rsync|screen|scp|sdiff|sed|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|sync|tail|tar|tee|test|time|timeout|times|touch|top|traceroute|trap|tr|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|uptime|useradd|userdel|usermod|users|uuencode|uudecode|v|vdir|vi|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yes|zip)\b/,
	'keyword': /\b(if|then|else|elif|fi|for|break|continue|while|in|case|function|select|do|done|until|echo|exit|return|set|declare)\b/
});

Prism.languages.insertBefore('bash', 'keyword', {
	//'property' class reused for bash variables
	'property': /\$([a-zA-Z0-9_#\?\-\*!@]+|\{[^}]+\})/
});
Prism.languages.insertBefore('bash', 'comment', {
	//shebang must be before comment, 'important' class from css reused
	'important': /^#!\s*\/bin\/bash|^#!\s*\/bin\/sh/
});
;
Prism.languages.c = Prism.languages.extend('clike', {
	'keyword': /\b(asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
	'operator': /\-[>-]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|?\||[~^%?*\/]/
});

Prism.languages.insertBefore('c', 'string', {
	'macro': {
		// allow for multiline macro definitions
		// spaces after the # character compile fine with gcc
		pattern: /(^\s*)#\s*[a-z]+([^\r\n\\]|\\.|\\(?:\r\n?|\n))*/im,
		lookbehind: true,
		alias: 'property',
		inside: {
			// highlight the path of the include statement as a string
			'string': {
				pattern: /(#\s*include\s*)(<.+?>|("|')(\\?.)+?\3)/,
				lookbehind: true
			}
		}
	}
});

delete Prism.languages.c['class-name'];
delete Prism.languages.c['boolean'];;
Prism.languages.csharp = Prism.languages.extend('clike', {
	'keyword': /\b(abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|add|alias|ascending|async|await|descending|dynamic|from|get|global|group|into|join|let|orderby|partial|remove|select|set|value|var|where|yield)\b/,
	'string': [
		/@("|')(\1\1|\\\1|\\?(?!\1)[\s\S])*\1/,
		/("|')(\\?.)*?\1/
	],
	'number': /\b-?(0x[\da-f]+|\d*\.?\d+)\b/i
});

Prism.languages.insertBefore('csharp', 'keyword', {
	'preprocessor': {
		pattern: /(^\s*)#.*/m,
		lookbehind: true
	}
});
;
Prism.languages.cpp = Prism.languages.extend('c', {
	'keyword': /\b(alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|class|compl|const|constexpr|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
	'boolean': /\b(true|false)\b/,
	'operator': /[-+]{1,2}|!=?|<{1,2}=?|>{1,2}=?|\->|:{1,2}|={1,2}|\^|~|%|&{1,2}|\|?\||\?|\*|\/|\b(and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/
});

Prism.languages.insertBefore('cpp', 'keyword', {
	'class-name': {
		pattern: /(class\s+)[a-z0-9_]+/i,
		lookbehind: true
	}
});;
Prism.languages.git = {
	/*
	 * A simple one line comment like in a git status command
	 * For instance:
	 * $ git status
	 * # On branch infinite-scroll
	 * # Your branch and 'origin/sharedBranches/frontendTeam/infinite-scroll' have diverged,
	 * # and have 1 and 2 different commits each, respectively.
	 * nothing to commit (working directory clean)
	 */
	'comment': /^#.*$/m,

	/*
	 * a string (double and simple quote)
	 */
	'string': /("|')(\\?.)*?\1/m,

	/*
	 * a git command. It starts with a random prompt finishing by a $, then "git" then some other parameters
	 * For instance:
	 * $ git add file.txt
	 */
	'command': {
		pattern: /^.*\$ git .*$/m,
		inside: {
			/*
			 * A git command can contain a parameter starting by a single or a double dash followed by a string
			 * For instance:
			 * $ git diff --cached
			 * $ git log -p
			 */
			'parameter': /\s(--|-)\w+/m
		}
	},

	/*
	 * Coordinates displayed in a git diff command
	 * For instance:
	 * $ git diff
	 * diff --git file.txt file.txt
	 * index 6214953..1d54a52 100644
	 * --- file.txt
	 * +++ file.txt
	 * @@ -1 +1,2 @@
	 * -Here's my tetx file
	 * +Here's my text file
	 * +And this is the second line
	 */
	'coord': /^@@.*@@$/m,

	/*
	 * Regexp to match the changed lines in a git diff output. Check the example above.
	 */
	'deleted': /^-(?!-).+$/m,
	'inserted': /^\+(?!\+).+$/m,

	/*
	 * Match a "commit [SHA1]" line in a git log output.
	 * For instance:
	 * $ git log
	 * commit a11a14ef7e26f2ca62d4b35eac455ce636d0dc09
	 * Author: lgiraudel
	 * Date:   Mon Feb 17 11:18:34 2014 +0100
	 *
	 *     Add of a new line
	 */
	'commit_sha1': /^commit \w{40}$/m
};
;
Prism.languages.go = Prism.languages.extend('clike', {
	'keyword': /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
	'builtin': /\b(bool|byte|complex(64|128)|error|float(32|64)|rune|string|u?int(8|16|32|64|)|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(ln)?|real|recover)\b/,
	'boolean': /\b(_|iota|nil|true|false)\b/,
	'operator': /([(){}\[\]]|[*\/%^!]=?|\+[=+]?|-[>=-]?|\|[=|]?|>[=>]?|<(<|[=-])?|==?|&(&|=|^=?)?|\.(\.\.)?|[,;]|:=?)/,
	'number': /\b(-?(0x[a-f\d]+|(\d+\.?\d*|\.\d+)(e[-+]?\d+)?)i?)\b/i,
	'string': /("|'|`)(\\?.|\r|\n)*?\1/
});
delete Prism.languages.go['class-name'];
;
Prism.languages.http = {
    'request-line': {
        pattern: /^(POST|GET|PUT|DELETE|OPTIONS|PATCH|TRACE|CONNECT)\b\shttps?:\/\/\S+\sHTTP\/[0-9.]+/,
        inside: {
            // HTTP Verb
            property: /^\b(POST|GET|PUT|DELETE|OPTIONS|PATCH|TRACE|CONNECT)\b/,
            // Path or query argument
            'attr-name': /:\w+/
        }
    },
    'response-status': {
        pattern: /^HTTP\/1.[01] [0-9]+.*/,
        inside: {
            // Status, e.g. 200 OK
            property: /[0-9]+[A-Z\s-]+$/i
        }
    },
    // HTTP header name
    keyword: /^[\w-]+:(?=.+)/m
};

// Create a mapping of Content-Type headers to language definitions
var httpLanguages = {
    'application/json': Prism.languages.javascript,
    'application/xml': Prism.languages.markup,
    'text/xml': Prism.languages.markup,
    'text/html': Prism.languages.markup
};

// Insert each content type parser that has its associated language
// currently loaded.
for (var contentType in httpLanguages) {
    if (httpLanguages[contentType]) {
        var options = {};
        options[contentType] = {
            pattern: new RegExp('(content-type:\\s*' + contentType + '[\\w\\W]*?)\\n\\n[\\w\\W]*', 'i'),
            lookbehind: true,
            inside: {
                rest: httpLanguages[contentType]
            }
        };
        Prism.languages.insertBefore('http', 'keyword', options);
    }
}
;
(function(Prism) {
	Prism.languages.jade = {

		// Multiline stuff should appear before the rest

		'multiline-comment': {
			pattern: /((?:^|\n)([\t ]*))\/\/.*(\n\2[\t ]+.+)*/,
			lookbehind: true,
			alias: 'comment'
		},

		// All the tag-related part is in lookbehind
		// so that it can be highlighted by the "tag" pattern
		'multiline-script': {
			pattern: /((?:^|\n)([\t ]*)script\b.*\.[\t ]*)(\n(?:\2[\t ]+.+|\s*?(?=\n)))+/,
			lookbehind: true,
			inside: {
				rest: Prism.languages.javascript
			}
		},

		// See at the end of the file for known filters
		'filter': {
			pattern: /((?:^|\n)([\t ]*)):.+(\n(?:\2[\t ]+.+|\s*?(?=\n)))+/,
			lookbehind: true,
			inside: {
				'filter-name': {
					pattern: /^:[\w-]+/,
					alias: 'variable'
				}
			}
		},

		'multiline-plain-text': {
			pattern: /((?:^|\n)([\t ]*)[\w\-#.]+\.[\t ]*)(\n(?:\2[\t ]+.+|\s*?(?=\n)))+/,
			lookbehind: true
		},
		'markup': {
			pattern: /((?:^|\n)[\t ]*)<.+/,
			lookbehind: true,
			inside: {
				rest: Prism.languages.markup
			}
		},
		'comment': {
			pattern: /((?:^|\n)[\t ]*)\/\/.+/,
			lookbehind: true
		},
		'doctype': {
			pattern: /((?:^|\n)[\t ]*)doctype(?: .+)?/,
			lookbehind: true
		},

		// This handle all conditional and loop keywords
		'flow-control': {
			pattern: /((?:^|\n)[\t ]*)(?:if|unless|else|case|when|default|each|while)(?: .+)?/,
			lookbehind: true,
			inside: {
				'each': {
					pattern: /((?:^|\n)[\t ]*)each .+? in\b/,
					lookbehind: true,
					inside: {
						'keyword': /\b(?:each|in)\b/,
						'punctuation': /,/
					}
				},
				'branch': {
					pattern: /((?:^|\n)[\t ]*)(?:if|unless|else|case|when|default|while)/,
					lookbehind: true,
					alias: 'keyword'
				},
				rest: Prism.languages.javascript
			}
		},
		'keyword': {
			pattern: /((?:^|\n)[\t ]*)(?:block|extends|include|append|prepend)\b.+/,
			lookbehind: true
		},
		'mixin': [
			// Declaration
			{
				pattern: /((?:^|\n)[\t ]*)mixin .+/,
				lookbehind: true,
				inside: {
					'keyword': /^mixin/,
					'function': /\w+(?=\s*\(|\s*$)/,
					'punctuation': /[(),.]/
				}
			},
			// Usage
			{
				pattern: /((?:^|\n)[\t ]*)\+.+/,
				lookbehind: true,
				inside: {
					'name': {
						pattern: /^\+\w+/,
						alias: 'function'
					},
					'rest': Prism.languages.javascript
				}
			}
		],
		'script': {
			pattern: /((?:^|\n)[\t ]*script(?:(?:&[^(]+)?\([^)]+\))*) .+/,
			lookbehind: true,
			inside: {
				rest: Prism.languages.javascript
			}
		},

		'plain-text': {
				pattern: /((?:^|\n)[\t ]*(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?[\t ]+).+/,
				lookbehind: true
		},
		'tag': {
			pattern: /((?:^|\n)[\t ]*)(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?:?/,
			lookbehind: true,
			inside: {
				'attributes': [
					{
						pattern: /&[^(]+\([^)]+\)/,
						inside: {
							rest: Prism.languages.javascript
						}
					},
					{
						pattern: /\([^)]+\)/,
						inside: {
							'attr-value': {
								pattern: /(=\s*)(?:\{[^}]*\}|[^,)\n]+)/,
								lookbehind: true,
								inside: {
									rest: Prism.languages.javascript
								}
							},
							'attr-name': /[\w-]+(?=\s*!?=|\s*[,)])/,
							'punctuation': /[!=(),]/
						}
					}
				],
				'punctuation': /[:]/
			}
		},
		'code': [
			{
				pattern: /((?:^|\n)[\t ]*(?:-|!?=)).+/,
				lookbehind: true,
				inside: {
					rest: Prism.languages.javascript
				}
			}
		],
		'punctuation': /[.\-!=|]/
	};

	var filter_pattern = '((?:^|\\n)([\\t ]*)):{{filter_name}}(\\n(?:\\2[\\t ]+.+|\\s*?(?=\\n)))+';

	// Non exhaustive list of available filters and associated languages
	var filters = [
		{filter:'atpl',language:'twig'},
		{filter:'coffee',language:'coffeescript'},
		'ejs',
		'handlebars',
		'hogan',
		'less',
		'livescript',
		'markdown',
		'mustache',
		'plates',
		{filter:'sass',language:'scss'},
		'stylus',
		'swig'

	];
	var all_filters = {};
	for (var i = 0, l = filters.length; i < l; i++) {
		var filter = filters[i];
		filter = typeof filter === 'string' ? {filter: filter, language: filter} : filter;
		if (Prism.languages[filter.language]) {
			all_filters['filter-' + filter.filter] = {
				pattern: RegExp(filter_pattern.replace('{{filter_name}}', filter.filter)),
				lookbehind: true,
				inside: {
					'filter-name': {
						pattern: /^:[\w-]+/,
						alias: 'variable'
					},
					rest: Prism.languages[filter.language]
				}
			}
		}
	}

	Prism.languages.insertBefore('jade', 'filter', all_filters);

}(Prism));;
Prism.languages.java = Prism.languages.extend('clike', {
	'keyword': /\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/,
	'number': /\b0b[01]+\b|\b0x[\da-f]*\.?[\da-fp\-]+\b|\b\d*\.?\d+[e]?[\d]*[df]\b|\b\d*\.?\d+\b/i,
	'operator': {
		pattern: /(^|[^\.])(?:\+=|\+\+?|-=|--?|!=?|<{1,2}=?|>{1,3}=?|==?|&=|&&?|\|=|\|\|?|\?|\*=?|\/=?|%=?|\^=?|:|~)/m,
		lookbehind: true
	}
});;
Prism.languages.makefile = {
	'comment': {
		pattern: /(^|[^\\])#(?:\\[\s\S]|.)*/,
		lookbehind: true
	},
	'string': /(["'])(?:\\[\s\S]|(?!\1)[^\\\r\n])*\1/,

	// Built-in target names
	'builtin': /\.[A-Z][^:#=\s]+(?=\s*:(?!=))/,

	// Targets
	'symbol': {
		pattern: /^[^:=\r\n]+(?=\s*:(?!=))/m,
		inside: {
			'variable': /\$+(?:[^(){}:#=\s]+|(?=[({]))/
		}
	},
	'variable': /\$+(?:[^(){}:#=\s]+|\([@*%<^+?][DF]\)|(?=[({]))/,

	'keyword': [
		// Directives
		/\b(?:define|else|endef|endif|export|ifn?def|ifn?eq|-?include|override|private|sinclude|undefine|unexport|vpath)\b/,
		// Functions
		{
			pattern: /(\()(?:addsuffix|abspath|and|basename|call|dir|error|eval|file|filter(?:-out)?|findstring|firstword|flavor|foreach|guile|if|info|join|lastword|load|notdir|or|origin|patsubst|realpath|shell|sort|strip|subst|suffix|value|warning|wildcard|word(?:s|list)?)(?=[ \t])/,
			lookbehind: true
		}
	],
	'operator': /(?:::|[?:+!])?=|[|@]/,
	'punctuation': /[:;(){}]/
};;
Prism.languages.markdown = Prism.languages.extend('markup', {});
Prism.languages.insertBefore('markdown', 'prolog', {
	'blockquote': {
		// > ...
		pattern: /(^|\n)>(?:[\t ]*>)*/,
		lookbehind: true,
		alias: 'punctuation'
	},
	'code': [
		{
			// Prefixed by 4 spaces or 1 tab
			pattern: /(^|\n)(?: {4}|\t).+/,
			lookbehind: true,
			alias: 'keyword'
		},
		{
			// `code`
			// ``code``
			pattern: /``.+?``|`[^`\n]+`/,
			alias: 'keyword'
		}
	],
	'title': [
		{
			// title 1
			// =======

			// title 2
			// -------
			pattern: /\w+.*\n(?:==+|--+)/,
			alias: 'important',
			inside: {
				punctuation: /==+$|--+$/
			}
		},
		{
			// # title 1
			// ###### title 6
			pattern: /((?:^|\n)\s*)#+.+/,
			lookbehind: true,
			alias: 'important',
			inside: {
				punctuation: /^#+|#+$/
			}
		}
	],
	'hr': {
		// ***
		// ---
		// * * *
		// -----------
		pattern: /((?:^|\n)\s*)([*-])([\t ]*\2){2,}(?=\s*(?:\n|$))/,
		lookbehind: true,
		alias: 'punctuation'
	},
	'list': {
		// * item
		// + item
		// - item
		// 1. item
		pattern: /((?:^|\n)\s*)(?:[*+-]|\d+\.)(?=[\t ].)/,
		lookbehind: true,
		alias: 'punctuation'
	},
	'url-reference': {
		// [id]: http://example.com "Optional title"
		// [id]: http://example.com 'Optional title'
		// [id]: http://example.com (Optional title)
		// [id]: <http://example.com> "Optional title"
		pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:[^>]|\\>)+>)(?:[\t ]+(?:"(?:[^"]|\\")*"|'(?:[^']|\\')*'|\((?:[^)]|\\\))*\)))?/,
		inside: {
			'variable': {
				pattern: /^(!?\[)[^\]]+/,
				lookbehind: true
			},
			'string': /(?:"(?:[^"]|\\")*"|'(?:[^']|\\')*'|\((?:[^)]|\\\))*\))$/,
			'punctuation': /[[\]\(\)<>:]/
		},
		alias: 'url'
	},
	'bold': {
		// **strong**
		// __strong__

		// Allow only one line break
		pattern: /(^|[^\\])(\*\*|__)(?:\n(?!\n)|.)+?\2/,
		lookbehind: true,
		inside: {
			'punctuation': /^\*\*|^__|\*\*\s*$|__\s*$/
		}
	},
	'italic': {
		// *em*
		// _em_

		// Allow only one line break
		pattern: /(^|[^\\])(?:\*(?:\n(?!\n)|.)+?\*|_(?:\n(?!\n)|.)+?_)/,
		lookbehind: true,
		inside: {
			'punctuation': /^[*_]|[*_]$/
		}
	},
	'url': {
		// [example](http://example.com "Optional title")
		// [example] [id]
		pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:[^"]|\\")*")?\)| ?\[[^\]\n]*\])/,
		inside: {
			'variable': {
				pattern: /(!?\[)[^\]]+(?=\]$)/,
				lookbehind: true
			},
			'string': {
				pattern: /"(?:[^"]|\\")*"(?=\)$)/
			}
		}
	}
});

Prism.languages.markdown['bold'].inside['url'] = Prism.util.clone(Prism.languages.markdown['url']);
Prism.languages.markdown['italic'].inside['url'] = Prism.util.clone(Prism.languages.markdown['url']);
Prism.languages.markdown['bold'].inside['italic'] = Prism.util.clone(Prism.languages.markdown['italic']);
Prism.languages.markdown['italic'].inside['bold'] = Prism.util.clone(Prism.languages.markdown['bold']);;
Prism.languages.perl = {
	'comment': [
		{
			// POD
			pattern: /((?:^|\n)\s*)=\w+[\s\S]*?=cut.*/,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\$])#.*?(\r?\n|$)/,
			lookbehind: true
		}
	],
	// TODO Could be nice to handle Heredoc too.
	'string': [
		// q/.../
		/\b(?:q|qq|qx|qw)\s*([^a-zA-Z0-9\s\{\(\[<])(\\?.)*?\s*\1/,
	
		// q a...a
		/\b(?:q|qq|qx|qw)\s+([a-zA-Z0-9])(\\?.)*?\s*\1/,
	
		// q(...)
		/\b(?:q|qq|qx|qw)\s*\(([^()]|\\.)*\s*\)/,
	
		// q{...}
		/\b(?:q|qq|qx|qw)\s*\{([^{}]|\\.)*\s*\}/,
	
		// q[...]
		/\b(?:q|qq|qx|qw)\s*\[([^[\]]|\\.)*\s*\]/,
	
		// q<...>
		/\b(?:q|qq|qx|qw)\s*<([^<>]|\\.)*\s*>/,

		// "...", '...', `...`
		/("|'|`)(\\?.)*?\1/
	],
	'regex': [
		// m/.../
		/\b(?:m|qr)\s*([^a-zA-Z0-9\s\{\(\[<])(\\?.)*?\s*\1[msixpodualgc]*/,
	
		// m a...a
		/\b(?:m|qr)\s+([a-zA-Z0-9])(\\?.)*?\s*\1[msixpodualgc]*/,
	
		// m(...)
		/\b(?:m|qr)\s*\(([^()]|\\.)*\s*\)[msixpodualgc]*/,
	
		// m{...}
		/\b(?:m|qr)\s*\{([^{}]|\\.)*\s*\}[msixpodualgc]*/,
	
		// m[...]
		/\b(?:m|qr)\s*\[([^[\]]|\\.)*\s*\][msixpodualgc]*/,
	
		// m<...>
		/\b(?:m|qr)\s*<([^<>]|\\.)*\s*>[msixpodualgc]*/,
	
		// s/.../.../
		/\b(?:s|tr|y)\s*([^a-zA-Z0-9\s\{\(\[<])(\\?.)*?\s*\1\s*((?!\1).|\\.)*\s*\1[msixpodualgcer]*/,
	
		// s a...a...a
		/\b(?:s|tr|y)\s+([a-zA-Z0-9])(\\?.)*?\s*\1\s*((?!\1).|\\.)*\s*\1[msixpodualgcer]*/,
	
		// s(...)(...)
		/\b(?:s|tr|y)\s*\(([^()]|\\.)*\s*\)\s*\(\s*([^()]|\\.)*\s*\)[msixpodualgcer]*/,
	
		// s{...}{...}
		/\b(?:s|tr|y)\s*\{([^{}]|\\.)*\s*\}\s*\{\s*([^{}]|\\.)*\s*\}[msixpodualgcer]*/,
	
		// s[...][...]
		/\b(?:s|tr|y)\s*\[([^[\]]|\\.)*\s*\]\s*\[\s*([^[\]]|\\.)*\s*\][msixpodualgcer]*/,
	
		// s<...><...>
		/\b(?:s|tr|y)\s*<([^<>]|\\.)*\s*>\s*<\s*([^<>]|\\.)*\s*>[msixpodualgcer]*/,
	
		// /.../
		/\/(\[.+?]|\\.|[^\/\r\n])*\/[msixpodualgc]*(?=\s*($|[\r\n,.;})&|\-+*=~<>!?^]|(lt|gt|le|ge|eq|ne|cmp|not|and|or|xor|x)\b))/
	],

	// FIXME Not sure about the handling of ::, ', and #
	'variable': [
		// ${^POSTMATCH}
		/[&*\$@%]\{\^[A-Z]+\}/,
		// $^V
		/[&*\$@%]\^[A-Z_]/,
		// ${...}
		/[&*\$@%]#?(?=\{)/,
		// $foo
		/[&*\$@%]#?((::)*'?(?!\d)[\w$]+)+(::)*/i,
		// $1
		/[&*\$@%]\d+/,
		// $_, @_, %!
		/[\$@%][!"#\$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~]/
	],
	'filehandle': {
		// <>, <FOO>, _
		pattern: /<(?!=).*>|\b_\b/,
		alias: 'symbol'
	},
	'vstring': {
		// v1.2, 1.2.3
		pattern: /v\d+(\.\d+)*|\d+(\.\d+){2,}/,
		alias: 'string'
	},
	'function': {
		pattern: /sub [a-z0-9_]+/i,
		inside: {
			keyword: /sub/
		}
	},
	'keyword': /\b(any|break|continue|default|delete|die|do|else|elsif|eval|for|foreach|given|goto|if|last|local|my|next|our|package|print|redo|require|say|state|sub|switch|undef|unless|until|use|when|while)\b/,
	'number': /(\n|\b)-?(0x[\dA-Fa-f](_?[\dA-Fa-f])*|0b[01](_?[01])*|(\d(_?\d)*)?\.?\d(_?\d)*([Ee]-?\d+)?)\b/,
	'operator': /-[rwxoRWXOezsfdlpSbctugkTBMAC]\b|[-+*=~\/|&]{1,2}|<=?|>=?|\.{1,3}|[!?\\^]|\b(lt|gt|le|ge|eq|ne|cmp|not|and|or|xor|x)\b/,
	'punctuation': /[{}[\];(),:]/
};
;
/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 *
 * Supports the following:
 * 		- Extends clike syntax
 * 		- Support for PHP 5.3+ (namespaces, traits, generators, etc)
 * 		- Smarter constant and function matching
 *
 * Adds the following new token classes:
 * 		constant, delimiter, variable, function, package
 */

Prism.languages.php = Prism.languages.extend('clike', {
	'keyword': /\b(and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|private|protected|parent|throw|null|echo|print|trait|namespace|final|yield|goto|instanceof|finally|try|catch)\b/i,
	'constant': /\b[A-Z0-9_]{2,}\b/,
	'comment': {
		pattern: /(^|[^\\])(\/\*[\w\W]*?\*\/|(^|[^:])(\/\/).*?(\r?\n|$))/,
		lookbehind: true
	}
});

// Shell-like comments are matched after strings, because they are less
// common than strings containing hashes...
Prism.languages.insertBefore('php', 'class-name', {
	'shell-comment': {
		pattern: /(^|[^\\])#.*?(\r?\n|$)/,
		lookbehind: true,
		alias: 'comment'
	}
});

Prism.languages.insertBefore('php', 'keyword', {
	'delimiter': /(\?>|<\?php|<\?)/i,
	'variable': /(\$\w+)\b/i,
	'package': {
		pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
		lookbehind: true,
		inside: {
			punctuation: /\\/
		}
	}
});

// Must be defined after the function pattern
Prism.languages.insertBefore('php', 'operator', {
	'property': {
		pattern: /(->)[\w]+/,
		lookbehind: true
	}
});

// Add HTML support of the markup language exists
if (Prism.languages.markup) {

	// Tokenize all inline PHP blocks that are wrapped in <?php ?>
	// This allows for easy PHP + markup highlighting
	Prism.hooks.add('before-highlight', function(env) {
		if (env.language !== 'php') {
			return;
		}

		env.tokenStack = [];

		env.backupCode = env.code;
		env.code = env.code.replace(/(?:<\?php|<\?)[\w\W]*?(?:\?>)/ig, function(match) {
			env.tokenStack.push(match);

			return '{{{PHP' + env.tokenStack.length + '}}}';
		});
	});

	// Restore env.code for other plugins (e.g. line-numbers)
	Prism.hooks.add('before-insert', function(env) {
		if (env.language === 'php') {
			env.code = env.backupCode;
			delete env.backupCode;
		}
	});

	// Re-insert the tokens after highlighting
	Prism.hooks.add('after-highlight', function(env) {
		if (env.language !== 'php') {
			return;
		}

		for (var i = 0, t; t = env.tokenStack[i]; i++) {
			env.highlightedCode = env.highlightedCode.replace('{{{PHP' + (i + 1) + '}}}', Prism.highlight(t, env.grammar, 'php'));
		}

		env.element.innerHTML = env.highlightedCode;
	});

	// Wrap tokens in classes that are missing them
	Prism.hooks.add('wrap', function(env) {
		if (env.language === 'php' && env.type === 'markup') {
			env.content = env.content.replace(/(\{\{\{PHP[0-9]+\}\}\})/g, "<span class=\"token php\">$1</span>");
		}
	});

	// Add the rules before all others
	Prism.languages.insertBefore('php', 'comment', {
		'markup': {
			pattern: /<[^?]\/?(.*?)>/,
			inside: Prism.languages.markup
		},
		'php': /\{\{\{PHP[0-9]+\}\}\}/
	});
}
;
Prism.languages.python= { 
	'comment': {
		pattern: /(^|[^\\])#.*?(\r?\n|$)/,
		lookbehind: true
	},
	'string': /"""[\s\S]+?"""|'''[\s\S]+?'''|("|')(\\?.)*?\1/,
	'function' : {
		pattern: /((^|\s)def[ \t]+)([a-zA-Z_][a-zA-Z0-9_]*(?=\())/g,
		lookbehind: true
	},
	'keyword' : /\b(as|assert|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|pass|print|raise|return|try|while|with|yield)\b/,
	'boolean' : /\b(True|False)\b/,
	'number' : /\b-?(0[bo])?(?:(\d|0x[a-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
	'operator' : /[-+]|<=?|>=?|!|={1,2}|&{1,2}|\|?\||\?|\*|\/|~|\^|%|\b(or|and|not)\b/,
	'punctuation' : /[{}[\];(),.:]/
};;
Prism.languages.r = {
	'comment': /#.+/,
	'string': /(['"])(?:\\?.)*?\1/,
	'percent-operator': {
		// Includes user-defined operators
		// and %%, %*%, %/%, %in%, %o%, %x%
		pattern: /%[^%]*?%/,
		alias: 'operator'
	},
	'boolean': /\b(?:TRUE|FALSE)\b/,
	'ellipsis': /\.\.(?:\.|\d+)/,
	'number': [
		/\b(?:NaN|Inf)\b/,
		/\b(?:0x[\dA-Fa-f]+(?:\.\d*)?|\d*\.?\d+)(?:[EePp][+-]??\d+)?[iL]?\b/
	],
	'keyword': /\b(?:if|else|repeat|while|function|for|in|next|break|NULL|NA|NA_integer_|NA_real_|NA_complex_|NA_character_)\b/,
	'operator': /->>?|<?<-|[<>!=]=?|::?|&&?|\|\|?|[+\-*\/^$@~]/,
	'punctuation': /[(){}\[\],;]/
};;
/**
 * Original by Samuel Flores
 *
 * Adds the following new token classes:
 * 		constant, builtin, variable, symbol, regex
 */
Prism.languages.ruby = Prism.languages.extend('clike', {
	'comment': /#(?!\{[^\r\n]*?\})[^\r\n]*(\r?\n|$)/,
	'keyword': /\b(alias|and|BEGIN|begin|break|case|class|def|define_method|defined|do|each|else|elsif|END|end|ensure|false|for|if|in|module|new|next|nil|not|or|raise|redo|require|rescue|retry|return|self|super|then|throw|true|undef|unless|until|when|while|yield)\b/,
	'builtin': /\b(Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Stat|File|Fixnum|Fload|Hash|Integer|IO|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|String|Struct|TMS|Symbol|ThreadGroup|Thread|Time|TrueClass)\b/,
	'constant': /\b[A-Z][a-zA-Z_0-9]*[?!]?\b/
});

Prism.languages.insertBefore('ruby', 'keyword', {
	'regex': {
		pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/,
		lookbehind: true
	},
	'variable': /[@$]+\b[a-zA-Z_][a-zA-Z_0-9]*[?!]?\b/,
	'symbol': /:\b[a-zA-Z_][a-zA-Z_0-9]*[?!]?\b/
});

Prism.languages.ruby.string = {
	pattern: /("|')(#\{[^}]+\}|\\\n|\\?.)*?\1/,
	inside: {
		'interpolation': {
			pattern: /#\{[^}]+\}/,
			inside: {
				'delimiter': {
					pattern: /^#\{|\}$/,
					alias: 'tag'
				},
				rest: Prism.util.clone(Prism.languages.ruby)
			}
		}
	}
};
;
Prism.languages.scala = Prism.languages.extend('java', {
	'keyword': /(<-|=>)|\b(abstract|case|catch|class|def|do|else|extends|final|finally|for|forSome|if|implicit|import|lazy|match|new|null|object|override|package|private|protected|return|sealed|self|super|this|throw|trait|try|type|val|var|while|with|yield)\b/,
	'builtin': /\b(String|Int|Long|Short|Byte|Boolean|Double|Float|Char|Any|AnyRef|AnyVal|Unit|Nothing)\b/,
	'number': /\b0x[\da-f]*\.?[\da-f\-]+\b|\b\d*\.?\d+[e]?[\d]*[dfl]?\b/i,
	'symbol': /'([^\d\s]\w*)/,
	'string': /(""")[\W\w]*?\1|("|\/)[\W\w]*?\2|('.')/
});
delete Prism.languages.scala['class-name'];
delete Prism.languages.scala['function'];
;
Prism.languages.sql= { 
	'comment': {
		pattern: /(^|[^\\])(\/\*[\w\W]*?\*\/|((--)|(\/\/)|#).*?(\r?\n|$))/,
		lookbehind: true
	},
	'string' : {
		pattern: /(^|[^@])("|')(\\?[\s\S])*?\2/,
		lookbehind: true
	},
	'variable': /@[\w.$]+|@("|'|`)(\\?[\s\S])+?\1/,
	'function': /\b(?:COUNT|SUM|AVG|MIN|MAX|FIRST|LAST|UCASE|LCASE|MID|LEN|ROUND|NOW|FORMAT)(?=\s*\()/i, // Should we highlight user defined functions too?
	'keyword': /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALTER|ANALYZE|APPLY|AS|ASC|AUTHORIZATION|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADE|CASCADED|CASE|CHAIN|CHAR VARYING|CHARACTER VARYING|CHECK|CHECKPOINT|CLOSE|CLUSTERED|COALESCE|COLUMN|COLUMNS|COMMENT|COMMIT|COMMITTED|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS|CONTAINSTABLE|CONTINUE|CONVERT|CREATE|CROSS|CURRENT|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|CURSOR|DATA|DATABASE|DATABASES|DATETIME|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DOUBLE PRECISION|DROP|DUMMY|DUMP|DUMPFILE|DUPLICATE KEY|ELSE|ENABLE|ENCLOSED BY|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPE|ESCAPED BY|EXCEPT|EXEC|EXECUTE|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR|FOR EACH ROW|FORCE|FOREIGN|FREETEXT|FREETEXTTABLE|FROM|FULL|FUNCTION|GEOMETRY|GEOMETRYCOLLECTION|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|IDENTITY|IDENTITY_INSERT|IDENTITYCOL|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTO|INVOKER|ISOLATION LEVEL|JOIN|KEY|KEYS|KILL|LANGUAGE SQL|LAST|LEFT|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONGBLOB|LONGTEXT|MATCH|MATCHED|MEDIUMBLOB|MEDIUMINT|MEDIUMTEXT|MERGE|MIDDLEINT|MODIFIES SQL DATA|MODIFY|MULTILINESTRING|MULTIPOINT|MULTIPOLYGON|NATIONAL|NATIONAL CHAR VARYING|NATIONAL CHARACTER|NATIONAL CHARACTER VARYING|NATIONAL VARCHAR|NATURAL|NCHAR|NCHAR VARCHAR|NEXT|NO|NO SQL|NOCHECK|NOCYCLE|NONCLUSTERED|NULLIF|NUMERIC|OF|OFF|OFFSETS|ON|OPEN|OPENDATASOURCE|OPENQUERY|OPENROWSET|OPTIMIZE|OPTION|OPTIONALLY|ORDER|OUT|OUTER|OUTFILE|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREV|PRIMARY|PRINT|PRIVILEGES|PROC|PROCEDURE|PUBLIC|PURGE|QUICK|RAISERROR|READ|READS SQL DATA|READTEXT|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEATABLE|REPLICATION|REQUIRE|RESTORE|RESTRICT|RETURN|RETURNS|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROWCOUNT|ROWGUIDCOL|ROWS?|RTREE|RULE|SAVE|SAVEPOINT|SCHEMA|SELECT|SERIAL|SERIALIZABLE|SESSION|SESSION_USER|SET|SETUSER|SHARE MODE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|START|STARTING BY|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLE|TABLES|TABLESPACE|TEMP(?:ORARY)?|TEMPTABLE|TERMINATED BY|TEXT|TEXTSIZE|THEN|TIMESTAMP|TINYBLOB|TINYINT|TINYTEXT|TO|TOP|TRAN|TRANSACTION|TRANSACTIONS|TRIGGER|TRUNCATE|TSEQUAL|TYPE|TYPES|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNPIVOT|UPDATE|UPDATETEXT|USAGE|USE|USER|USING|VALUE|VALUES|VARBINARY|VARCHAR|VARCHARACTER|VARYING|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH|WITH ROLLUP|WITHIN|WORK|WRITE|WRITETEXT)\b/i,
	'boolean': /\b(?:TRUE|FALSE|NULL)\b/i,
	'number': /\b-?(0x)?\d*\.?[\da-f]+\b/,
	'operator': /\b(?:ALL|AND|ANY|BETWEEN|EXISTS|IN|LIKE|NOT|OR|IS|UNIQUE|CHARACTER SET|COLLATE|DIV|OFFSET|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b|[-+]|!|[=<>]{1,2}|(&){1,2}|\|?\||\?|\*|\//i,
	'punctuation': /[;[\]()`,.]/
};;
Prism.languages.stylus = {
	'comment': {
		pattern: /(^|[^\\])(\/\*[\w\W]*?\*\/|\/\/.*?(\r?\n|$))/g,
		lookbehind: true
	},
	'keyword': /(px|r?em|ex|ch|vw|vh|vmin|vmax|deg|grad|rad|turn|m?s|k?Hz|dpi|dppx|dpcm)\b|\b(is|defined|not|isnt|and|or|unless|for|in)\b/g,
	'atrule': /@[\w-]+(?=\s+\S+)/gi,
	'url': /url\((["']?).*?\1\)/gi,
	'variable': /^\s*([\w-]+)(?=\s*[+-\\]?=)/gm,
	'string': /("|')(\\\n|\\?.)*?\1/g,
	'important': /\B!important\b/gi,
	'hexcode': /#[\da-f]{3,6}/gi,
	'entity': /\\[\da-f]{1,8}/gi,
	'number': /\d+\.?\d*%?/g,
	'selector': [
		{
			pattern: /::?(after|before|first-letter|first-line|selection)/g,
			alias: 'pseudo-element'
		},{
			pattern: /:(?:active|checked|disabled|empty|enabled|first-child|first-of-type|focus|hover|in-range|invalid|lang|last-child|last-of-type|link|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-of-type|only-child|optional|out-of-range|read-only|read-write|required|root|target|valid|visited)(?:\(.*\))?/g,
			alias:'pseudo-class'
		},{
			pattern: /\[[\w-]+?\s*[*~$^|=]?(?:=\s*\S+)?\]/g,
			inside: {
				"attr-name":
				{
					pattern: /(\[)([\w-]+)(?=\s*[*~$^|=]{0,2})/g,
					lookbehind: true
				},
				"punctuation": /\[|\]/g,
				"operator": /[*~$^|=]/g,
				"attr-value": {
					pattern: /\S+/
				},
			},
			alias: 'attr'
		},
		{
			pattern: /\.[a-z-]+/i,
			alias: 'class'
		},
		{
			pattern: /#[a-z-]+/i,
			alias: 'id'
		},
		{
			pattern: /\b(html|head|title|base|link|meta|style|script|noscript|template|body|section|nav|article|aside|h[1-6]|header|footer|address|main|p|hr|pre|blockquote|ol|ul|li|dl|dt|dd|figure|figcaption|div|a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|dbo|span|br|wbr|ins|del|image|iframe|embed|object|param|video|audio|source|track|canvas|map|area|sv|math|table|caption|colgroup|col|tbody|thead|tfoot|tr|td|th|form|fieldset|legeng|label|input|button|select|datalist|optgroup|option|textarea|keygen|output|progress|meter|details|summary|menuitem|menu)\b/g,
			alias: 'tag'
		},
	],
	'property': [
		/^\s*([a-z-]+)(?=\s+[\w\W]+|\s*:)(?!\s*\{|\r?\n)/mig,
		{
			pattern: /(\(\s*)([a-z-]+)(?=\s*:)/ig,
			lookbehind: true
		}
	],
	'function': /[-a-z0-9]+(?=\()/ig,
	'punctuation': /[\{\};:]/g,
	'operator': /[-+]{1,2}|!|<=?|>=?|={1,3}|&{1,2}|\|?\||\?|\*|\/|~|\^|%/g
}
;
