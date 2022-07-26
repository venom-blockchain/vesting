compile:
	@echo Compiling:
	npx locklift build --config locklift.config.js


network=local
deploy-factory:
	@echo Deploying factory to network $(network):
	npx locklift run --config locklift.config.js --network $(network) -s script/1-deploy-factory.js


file=test/*
network=local
tests:
	@echo Running test $(file) on network $(network):
	npx locklift test --config locklift.config.js --network $(network) --tests $(file)
