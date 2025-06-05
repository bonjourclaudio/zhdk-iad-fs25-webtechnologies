.SHELL := /bin/bash

.PHONY: update-json

all: clean update-json

clean:
	@echo "Cleaning up..."
	@rm -f exercises.json
	@echo "Done."


update-json:
	@echo "Updating exercises.json..."
	@touch exercises.json
	@bash -c 'jq -s "add | unique" \
		<(jq -r ".[]" exercises.json 2>/dev/null || echo "[]") \
		<(find . -maxdepth 1 -type d -name "ex*" | sed "s|^\./||" | jq -R . | jq -s .) \
		> exercises.json.tmp'
	@mv exercises.json.tmp exercises.json
	@echo "Done. Updated exercises.json"