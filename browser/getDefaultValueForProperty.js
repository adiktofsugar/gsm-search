import queries from "./queries";
import getDefaultValueForQuery from "./getDefaultValueForQuery";

export default property => {
  const query = queries.find(q => q.property === property);
  if (!query) {
    return "";
  }
  return getDefaultValueForQuery(query);
};
