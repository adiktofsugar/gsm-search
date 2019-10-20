const parseArgs = require("minimist");
const esprima = require("esprima");
const { getDbAndCollection } = require("./lib/mongo");

require("source-map-support").install({ environment: "node" });

const argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: "help",
    d: "debug"
  },
  boolean: ["help", "debug"]
});

const usage = `
search [-h][-d] [query][,query...]
 -h - help
 -d - debug
 query - something to be translated to mongodb like things, so...
  - "size.width $gte 50"
  - "memory $regex /[234] GB RAM/"
`;

if (argv.help) {
  console.log(usage);
  process.exit();
}

const convertAstExpressionToObject = expression => {
  if (expression.type === "Literal") {
    return expression.value;
  }
  if (expression.type === "Identifier") {
    // identifiers are for existing variables. we have none of those, so treat this like a literal instead
    return expression.name;
  }
  if (expression.type === "ArrayExpression") {
    return expression.elements.map(convertAstExpressionToObject);
  }
  if (expression.type === "ObjectExpression") {
    const value = {};
    expression.properties.forEach(property => {
      const { name } = property.key;
      value[name] = convertAstExpressionToObject(property.value);
    });
    return value;
  }
  throw new Error(`Can't handle expression type ${expression.type}`);
  // if (expression.type === 'NewExpression') {
  //   const {callee, arguments} = expression;
  //   // this'll be
  //   return eval(
  //     `new ${callee}(` +
  //       `${arguments.map(convertAstNodeToObject})})`
  //   );
  // }
};

const convertAstNodeToObject = astNode => {
  if (astNode.type === "ExpressionStatement") {
    return convertAstExpressionToObject(astNode.expression);
  }
  if (astNode.type === "BlockStatement") {
    const value = {};
    astNode.body.forEach(childAstNode => {
      if (childAstNode.type === "LabeledStatement") {
        const { label, body } = childAstNode;
        if (label.type !== "Identifier") {
          throw new Error(`Unknown label type ${label.type}`);
        }
        value[label.name] = convertAstNodeToObject(body);
      }
    });
    return value;
  }
  throw new Error(`Unknown type ${astNode.type}`);
};

const convertQueryStringToMongoQuery = queryString => {
  const queryStringParts = queryString.split(/\s+/);
  let [name, op, ...value] = queryStringParts;

  const isOr = !!name.match(/^\$?or/);

  // everything else is like {propname: filter}
  // but or is like {$or: [filter, filter]}
  if (isOr) {
    value = [op].concat(value);
    op = name;
  }
  if (!op.match(/^\$/)) {
    op = `$${op}`;
  }

  value = value
    .join(" ")
    .replace(/^\s+/, "")
    .replace(/\s+$/, "");
  if (!value) {
    throw new Error(`query must have value -> ${queryString}`);
  }

  const astNode = esprima.parse(value).body[0];
  value = convertAstNodeToObject(astNode);

  if (isOr) {
    name = op;
    value = value.map(childQueryString => {
      const [childName, childValue] = convertQueryStringToMongoQuery(
        childQueryString
      );
      return {
        [childName]: childValue
      };
    });
  } else {
    value = {
      [op]: value
    };
  }
  return [name, value];
};

const search = async queryStrings => {
  const [db, collection] = await getDbAndCollection();

  const mongoQuery = {};
  queryStrings.forEach(queryString => {
    const [name, initialValue] = convertQueryStringToMongoQuery(queryString);
    let value = initialValue;
    if (mongoQuery[name]) {
      value = {
        ...mongoQuery[name],
        ...value
      };
    }
    mongoQuery[name] = value;
  });
  if (argv.debug) {
    console.log(`[DEBUG] query: ${JSON.stringify(mongoQuery, null, 2)}`);
  }
  const results = await collection
    .find(mongoQuery)
    .project({ _id: 0 })
    .toArray();
  // making an html file and opening it would probably be better
  console.log(JSON.stringify(results), null, 2);
  console.log(`Found ${results.length} results`);

  await db.close();
};
search(argv._).catch(e => {
  console.error(e);
  process.exit(1);
});
