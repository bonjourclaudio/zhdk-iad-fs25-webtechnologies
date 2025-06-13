# Webtechnologies | ZHdK IAD FS 25 | Claudio Weckherlin

https://webtechnologies.claudioweckherlin.com/

## Exercises

Day 01 - HTML: [02.06.2025](/ex01_02_06_25_html/)
Day 02 - HTML: [03.06.2025](/ex02_03_06_25_css/)
Day 03 - HTML: [04.06.2025](/ex03_04_06_25_layout/)
Day 04 - HTML: [05.06.2025](/ex04_05_06_25_js/)
Day 05 - HTML: [06.06.2025](/ex05_06_06_25_final/)

## Makefile - Get Exercises as list

In order to have every exercise subfolder (per day) available on the root page, the makefile will generate a json file which then can be read and displayed in the root html.

Use `make all` to clean the exercises.json directory and build it again
`make clean`: delete exercises.json
`make update-json`: rebuild exercises.json (read subfolders starting with "ex" and put them in the list)
