.PHONY: serve setup check example record-store
CXX ?= g++
CXXFLAGS := -std=c++20 -Wall -Wextra -Werror
setup:
	npm ci
	python3 tools/prepare_toolchain.py
serve:
	python3 -m http.server 8080 --directory dist
check:
	npm run export
	npm run test:native
	npm test
example:
	@node -e 'const ids=JSON.parse(require("fs").readFileSync("native/lessons.json")); if(!ids.some(l=>l.id===process.argv[1]))process.exit(1)' '$(EXAMPLE)'
	@mkdir -p .build
	$(CXX) $(CXXFLAGS) -pthread native/examples/$(EXAMPLE).cpp -o .build/example
	@task_dir=$$(mktemp -d); trap 'rm -rf "$$task_dir"' EXIT; cd "$$task_dir" && "$(CURDIR)/.build/example"
record-store:
	@mkdir -p .build
	$(CXX) $(CXXFLAGS) native/record-store.cpp -o .build/record-store
	.build/record-store
