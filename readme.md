Search gsmarena.com via mongo cli
===

## Installation
`git clone git@github.com:adiktofsugar/gsm-search.git`
`cd gsm-search`
`npm install`
`brew install mongodb`

## Building local db
`mongod --config /usr/local/etc/mongod.conf`
`npm run build-db`

## Searching local db
`npm run search-db -- "size.width gte 50" "size.width lte 65"`
- it's space delimited only for the first two, the last part is interpreted as javascript, with the exception that variables are treated as strings (so "maker_name eq Sony" is fine)
- or takes multiple querystrings of the above format, like "or ['maker_name eq Sony', 'maker_name eq Samsung']"
- if you don't like these limitations, you can query mongo directly, or add support for whatever it is you want

## Rebuilding local db

`npm run build-db -- -F`
- deletes all cache (list, fetched details, converted details)

`npm run build-db -- -f c`
- deletes only the converted details
- use this if you update this library and want to be sure you're getting the right objects inserted. for instance, if I add propery memory string parsing, so you can do things like "memory gte 3" instead of "memory regex /[345] GB RAM/"

`npm run build-db -- -f d`
- deletes only the details (fetched and converted)
- Do this if for some reason you believe the details in gsmarena changed

`npm run build-db -- -f l`
- deletes only the fetched list
- do this if you think a new phone has been added...I'll probably expire this cache after a while...
