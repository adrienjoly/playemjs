# inspired by: https://gist.github.com/rgrove/1116056

# PLAYERS = playem-dailymotion.js playem-soundcloud.js playem-youtube.js playem-audiofile.js playem-deezer.js playem-vimeo.js
PLAYERS = $(filter-out %-TODO.js,$(wildcard \
	./playem*.js \
))

# Command to run to execute the YUI Compressor.
YUI_COMPRESSOR = /usr/local/bin/yuicompressor
YUI_COMPRESSOR_FLAGS = --charset utf-8 --verbose

GIT_COMMIT_HASH = `git rev-parse HEAD`

default:
	@echo targets: compile, install

playem-all.js: $(PLAYERS)
	@echo '==> Compiling: $(PLAYERS)'
	@mkdir -p ./dist
	@echo "/* playemjs commit: $(GIT_COMMIT_HASH) */\n" > ./dist/playem-all.js
	@cat $(PLAYERS) >> ./dist/playem-all.js
	@echo

playem-min.js: playem-all.js
	@echo '==> Minifying $<'
	@echo "/* playemjs commit: $(GIT_COMMIT_HASH) */ " > ./dist/playem-min.js
	$(YUI_COMPRESSOR) $(YUI_COMPRESSOR_FLAGS) --type js ./dist/playem-all.js >> ./dist/playem-min.js
	# $< >$@
	@echo
	@echo Finished producing ./dist/playem-all.js and ./dist/playem-min.js
	@echo Playemjs commit: $(GIT_COMMIT_HASH)
	@echo

tests:
	@./test/server.sh

compile: playem-min.js

install:
	brew install yuicompressor
