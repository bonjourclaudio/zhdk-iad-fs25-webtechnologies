# Webtechnologies | ZHdK IAD FS 25 | Claudio Weckherlin
https://webtechnologies.claudioweckherlin.com/

## Exercises
Day 01 - HTML: [02.06.2025](/ex01_02_06_25_html/)


## Makefile - Get Exercises as list
In order to have every exercise subfolder (per day) available on the root page, the makefile will generate a json file which then can be read and displayed in the root html.

Use `make all` to clean the exercises.json directory and build it again
`make clean`: delete exercises.json
`make update-json`: rebuild exercises.json (read subfolders starting with "ex" and put them in the list)