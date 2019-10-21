import getDefaultValueForProperty from "./getDefaultValueForProperty";

const getInitialValues = () => ({
  property: ""
});

export const init = () => ({
  pendingId: 0,
  pendingValues: getInitialValues(),
  filters: []
});

export default (state, action) => {
  switch (action.type) {
    case "addPending": {
      const {
        pendingId: id,
        pendingValues: values,
        filters: currentFilters
      } = state;
      if (values.value === undefined) {
        values.value = getDefaultValueForProperty(values.property);
      }
      const filters = [...currentFilters, { id, values }];
      const pendingId = id + 1;
      const pendingValues = getInitialValues();
      return {
        ...state,
        pendingId,
        pendingValues,
        filters
      };
    }
    case "updatePending": {
      const { values: pendingValues } = action.payload;
      return {
        ...state,
        pendingValues
      };
    }
    case "update": {
      const { id, values } = action.payload;
      const { filters: currentFilters } = state;
      const filters = currentFilters.map(filter => {
        if (filter.id !== id) {
          return filter;
        }
        return {
          ...filter,
          values
        };
      });
      return {
        ...state,
        filters
      };
    }
    case "remove": {
      const { id } = action.payload;
      const { filters: currentFilters } = state;
      const filters = currentFilters.filter(c => c.id !== id);
      return {
        ...state,
        filters
      };
    }
    default:
      return state;
  }
};
