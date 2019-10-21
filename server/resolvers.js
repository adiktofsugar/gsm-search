/* eslint-disable no-param-reassign */
const addRegex = (query, fieldName, regex) => {
  if (regex) {
    query[fieldName] = {
      $regex: regex
    };
  }
};

const addRange = (query, fieldName, min, max) => {
  if (min || max) {
    const matcher = {};
    if (min) {
      matcher.$gte = min;
    }
    if (max) {
      matcher.$lte = max;
    }
    query[fieldName] = matcher;
  }
};
/* eslint-enable no-param-reassign */

module.exports = {
  Query: {
    phones: (
      _,
      {
        name,
        available,
        minReleased,
        maxReleased,
        minSizeWidth,
        maxSizeWidth,
        minSizeHeight,
        maxSizeHeight,
        minSizeDepth,
        maxSizeDepth,
        minMemoryKb,
        maxMemoryKb,
        minMemoryMb,
        maxMemoryMb,
        minMemoryGb,
        maxMemoryGb,
        cpu,
        page
      },
      { dataSources }
    ) => {
      const query = {};
      if (available) {
        query["status.available"] = {
          $eq: true
        };
      }
      addRegex(query, "phone_name", name);
      // dates have to be serialized to iso when used in a query,
      // so 2018-01-01 is fine for released
      addRange(query, "status.released", minReleased, maxReleased);
      addRange(query, "size.width", minSizeWidth, maxSizeWidth);
      addRange(query, "size.height", minSizeHeight, maxSizeHeight);
      addRange(query, "size.depth", minSizeDepth, maxSizeDepth);
      addRange(query, "memory.kb", minMemoryKb, maxMemoryKb);
      addRange(query, "memory.mb", minMemoryMb, maxMemoryMb);
      addRange(query, "memory.gb", minMemoryGb, maxMemoryGb);
      addRegex(query, "cpu", cpu);
      return dataSources.phonesAPI.getPhonesByQuery(query, page);
    }
  }
};
