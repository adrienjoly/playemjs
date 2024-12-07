# inspired by: https://gist.github.com/rgrove/1116056

# PLAYERS = playem-dailymotion.js playem-soundcloud.js playem-youtube.js playem-audiofile.js playem-deezer.js playem-vimeo.js
PLAYERS = playem.js
PLAYERS += $(filter-out %-TODO.js,$(wildcard \
	./playem-*.js \
))

GIT_COMMIT_HASH = `git rev-parse HEAD`
PACKAGE_VERSION=`node -p "require('./package.json').version"`

.PHONY: build docs test

default: build

publish:
	npm publish

build: clean dist/playem-all.js dist/playem-min.js docs

clean:
	rm -rf dist/

docs: dist/playem-all.js
	node_modules/.bin/documentation build dist/playem-all.js -f html -o docs
	node_modules/.bin/documentation build dist/playem-all.js -f md -o docs/docs.md

test: $(PLAYERS) dist/playem-all.js dist/playem-min.js
	node_modules/.bin/mocha --exit
	@echo "Run 'make test-web' to run additional tests in the browser."

test-web: $(PLAYERS) dist/playem-all.js dist/playem-min.js
	@echo "👉 Start tests from http://localhost:8000/test"
	@echo "   Press Ctrl-C when done"
	@npx http-server --port 8000

dist/playem-all.js: $(PLAYERS) node_modules
	@echo '==> Compiling: $(PLAYERS)'
	@mkdir -p ./dist
	@echo "/* playemjs $(PACKAGE_VERSION), commit: $(GIT_COMMIT_HASH) */\n" > ./dist/playem-all.js
	@cat $(PLAYERS) >> ./dist/playem-all.js
	@echo

dist/playem-min.js: dist/playem-all.js node_modules
	@echo '==> Minifying $<'
	@echo "/* playemjs $(PACKAGE_VERSION), commit: $(GIT_COMMIT_HASH) */ " > ./dist/playem-min.js
	npm exec terser ./dist/playem-all.js >> ./dist/playem-min.js
	@echo
	@echo Finished producing ./dist/playem-all.js and ./dist/playem-min.js
	@echo Playemjs $(PACKAGE_VERSION), commit: $(GIT_COMMIT_HASH)
	@echo

node_modules:
	@echo "Run 'nvm use' to use the version of Node.js specified in .nvmrc"
	npm install
