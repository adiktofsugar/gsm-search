import parseArgs from 'minimist';
import {getDbAndCollection} from './mongo';

var argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: 'help'
  },
  boolean: ['help']
});

const usage = `
search [-h] [query][,query...]
 -h - help
 query - something to be translated to mongodb like things, so...
  - "size.width $gte 50"
  - "memory $regex /[234] GB RAM/"
`

if (argv.help) {
  console.log(usage);
  process.exit();
}

const search = async (queries) => {
  let [db, collection] = await getDbAndCollection();

  let mongoQuery = {};
  queries.forEach(query => {
    const queryParts = query.split(/\s+/);
    let [name, op, ...value] = queryParts;
    if (!mongoQuery[name]) {
      mongoQuery[name] = {};
    }

    op = '$' + op;

    // I'm accepting values that are object literals or regexes
    value = value.join(' ');
    if (value.match(/^[\{\/]/)) {
      value = eval(value);
    } else if (value.match(/^[0-9\.]+$/)) {
      value = parseFloat(value);
    }

    mongoQuery[name] = {
      ...mongoQuery[name],
      [op]: value
    };
  });

  // console.log('query', mongoQuery);
  const results = await collection.find(mongoQuery).project({_id:0}).toArray();
  console.dir(results);

  await db.close();
}
search(argv._).catch(e => {
  console.error(e);
  process.exit(1);
});
