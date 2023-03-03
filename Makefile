.PHONY: build
build:
	npm run build
	## needs nodejs > v18.x.y for openssl-legacy-provider option to work
	## nvm use v18.14.0
	## NODE_OPTIONS=--openssl-legacy-provider if node version v18.x.x
	npm run package
