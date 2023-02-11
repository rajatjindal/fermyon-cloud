.PHONY: build
build:
	npm run build
	## needs nodejs > v18.x.y for openssl-legacy-provider option to work
	NODE_OPTIONS=--openssl-legacy-provider npm run package
