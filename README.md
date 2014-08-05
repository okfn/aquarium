## aquarium

[![Build Status](https://travis-ci.org/okfn/aquarium.svg?branch=develop)](https://travis-ci.org/okfn/aquarium)

Aquarium is web application with works with [Beagle](https://github.com/okfn/beagle) to feed it sites to watch.

It also track reports from researchers on budget documents for the [International Budget Survey](http://internationalbudget.org/)'s [Open Budget Survey](http://internationalbudget.org/what-we-do/open-budget-survey/).

## Installation

This assumes you have git installed and node installed.

    > git clone https://github.com/okfn/aquarium.git
    > cd aquarium
    > cp .env-example .env # edit to appropriate values
    > npm start

Then navigation to the `/login` page to configure the administrator's login. 

### Docker

If you don't want to install it on your local machine, there's a Dockerfile
available. You simply need to go to Aquarium's home folder and do:

    > docker build -t aquarium .
    > docker run -p 3000:3000 -v /path/to/your/aquarium/clone:/aquarium -i -t aquarium /bin/bash
    # Here you'll be inside Docker
    > mongod &
    > cd /aquarium
    > cp .env-example .env # edit to appropriate values
    > npm start

Aquarium should be running on http://localhost:3000.

## Translations

### Extracting Translations

    > xgettext -j --keyword=format -L Python --output-dir=locale --from-code=utf-8 --output=messages.pot `find views -name '*.jade'`

This will generate the translations from all source jade files. This step is only necessary if the source code has changed.

### Initialise Translations

To initialise a new language, do the following:

    > mkdir -p locale/<language>/LC_MESSAGES
    > msginit --input=./locale/messages.pot --output=./locale/<language>/LC_MESSAGES/messages.po -l <language>

Example:

    > mkdir -p locale/en/LC_MESSAGES
    > msginit --input=./locale/messages.pot --output=./locale/en/LC_MESSAGES/messages.po -l en

This will generate a file based on the `messages.pot` ready for translation.

### Update Translations

To update an already existing language, use the following command:

    > node_modules/i18n-abide/bin/merge-po.sh ./locale

### Translate

Translate with your favourite po file translator, e.g. [poedit](http://www.poedit.net/). The project could also be uploaded to Transifex with little effort (not supported at the moment). The po file to be translated will be available in `locale/<language>/LC_MESSAGES/messages.po`

### Compile Translations

Run the following command to compile the translations ready for use:

    > ./update_translation-json.sh
