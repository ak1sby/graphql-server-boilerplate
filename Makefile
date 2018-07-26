start:
	yarn start

build:
	rm -rf dist
	yarn build

test:
	yarn test

lint:
	yarn eslint .

test-coverage:
	yarn test -- --coverage
