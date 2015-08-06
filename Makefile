

.PHONY: watch

watch:
	tsc --rootDir . --outDir out --module commonjs --watch *.ts

