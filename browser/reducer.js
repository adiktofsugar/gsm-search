import getDefaultValueForProperty from "./getDefaultValueForProperty";

export const init = () => ({
  pendingProperty: "",
  pendingValue: "",
  filters: []
});

export default (state, action) => {
  switch (action.type) {
    case "addPending": {
      const {
        pendingProperty: property,
        pendingValue,
        filters: currentFilters
      } = state;
      const value =
        pendingValue === undefined
          ? getDefaultValueForProperty(property)
          : pendingValue;
      const filters = [...currentFilters, { property, value }];
      return {
        ...state,
        pendingProperty: "",
        pendingValue: "",
        filters
      };
    }
    case "updatePending": {
      const { property, value } = action.payload;
      return {
        ...state,
        pendingProperty: property,
        pendingValue: value
      };
    }
    case "upsert": {
      const {
        values: { value, property }
      } = action.payload;
      const {
        pendingValue: currentPendingValue,
        pendingProperty: currentPendingProperty,
        filters: currentFilters
      } = state;
      let pendingProperty = currentPendingProperty;
      let pendingValue = currentPendingValue;
      if (currentPendingProperty === property) {
        pendingProperty = "";
        pendingValue = "";
      }
      const otherFilters = currentFilters.filter(f => f.property !== property);
      const filters = [
        ...otherFilters,
        {
          value,
          property
        }
      ];
      return {
        ...state,
        pendingValue,
        pendingProperty,
        filters
      };
    }
    case "remove": {
      const { property } = action.payload;
      const { filters: currentFilters } = state;
      const filters = currentFilters.filter(f => f.property !== property);
      return {
        ...state,
        filters
      };
    }
    default:
      return state;
  }
};
