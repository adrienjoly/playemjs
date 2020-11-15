# inspired by: https://gist.github.com/rgrove/1116056

# PLAYERS = playem-dailymotion.js playem-soundcloud.js playem-youtube.js playem-audiofile.js playem-deezer.js playem-vimeo.js
PLAYERS = playem.js
PLAYERS += $(filter-out %-TODO.js,$(wildcard \
	./playem-*.js \
))

# Command to run to execute the YUI Compressor.
YUI_COMPRESSOR = node_modules/.bin/yuicompressor
YUI_COMPRESSOR_FLAGS = --charset utf-8 --verbose

GIT_COMMIT_HASH = `git rev-parse HEAD`
PACKAGE_VERSION=`node -p "require('./package.json').version"`

default: build

build: clean playem-all.js playem-min.js docs

clean:
	rm -rf dist/

docs: playem-all.js
	node_modules/.bin/documentation build dist/playem-all.js -f html -o docs
	node_modules/.bin/documentation build dist/playem-all.js -f md -o docs/docs.md

playem-all.js: node_modules $(PLAYERS)
	@echo '==> Compiling: $(PLAYERS)'
	@mkdir -p ./dist
	@echo "/* playemjs $(PACKAGE_VERSION), commit: $(GIT_COMMIT_HASH) */\n" > ./dist/playem-all.js
	@cat $(PLAYERS) >> ./dist/playem-all.js
	@echo

playem-min.js: node_modules playem-all.js
	@echo '==> Minifying $<'
	@echo "/* playemjs $(PACKAGE_VERSION), commit: $(GIT_COMMIT_HASH) */ " > ./dist/playem-min.js
	$(YUI_COMPRESSOR) $(YUI_COMPRESSOR_FLAGS) --type js ./dist/playem-all.js >> ./dist/playem-min.js
	# $< >$@
	@echo
	@echo Finished producing ./dist/playem-all.js and ./dist/playem-min.js
	@echo Playemjs $(PACKAGE_VERSION), commit: $(GIT_COMMIT_HASH)
	@echo

node_modules:
	@echo "Run 'nvm use' to use the version of Node.js specified in .nvmrc"
	npm install

test: clean playem-min.js
	@echo "👉 Start tests from http://localhost:8000/test"
	@echo "   Press Ctrl-C when done"
	@python -m SimpleHTTPServer >/dev/null
