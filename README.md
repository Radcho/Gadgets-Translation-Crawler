# Gadgets-Translation-Crawler

## Finding missing translations
Run the script with `npm run find`.

The script will use the *locales* folder in the project root directory.
It will process all translation files and output a *missing.csv* file with the `key,value` pairs in a table format.

## Adding translations from csv to json
Run the script with `npm run add`.

The script will use a base *translations.csv* file with the newly translated files.
The first row must contain the names of the translation folders, with the first column being the translation keys.

## Cleaning the directory
Run the cleaning script with `npm run clean`.

This will delete the *locales* folder and *missing.csv*.