import React, { useCallback } from "react";
import PropTypes from "prop-types";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import AddIcon from "@material-ui/icons/Add";
import ClearIcon from "@material-ui/icons/Clear";
import stateShape from "./shapes/state";
import FilterForm from "./FilterForm";

const FilterList = ({ state, dispatch }) => {
  const { filters, pendingValue, pendingProperty } = state;
  const updateFilter = useCallback(
    (property, value) => {
      dispatch({ type: "update", payload: { property, value } });
    },
    [dispatch]
  );
  const removeFilter = useCallback(
    property => {
      dispatch({ type: "remove", payload: { property } });
    },
    [dispatch]
  );
  const updatePendingFilter = useCallback(
    (property, value) => {
      dispatch({ type: "updatePending", payload: { property, value } });
    },
    [dispatch]
  );
  const addPendingFilter = useCallback(() => {
    dispatch({ type: "addPending", payload: {} });
  }, [dispatch]);
  return (
    <List>
      {filters.map(filter => (
        <ListItem key={filter.property}>
          <FilterForm
            onChange={({ value }) => {
              updateFilter(filter.property, value);
            }}
            property={filter.property}
            value={filter.value}
            icon={<ClearIcon />}
            onSubmit={() => {
              removeFilter(filter.property);
            }}
          />
        </ListItem>
      ))}
      <ListItem>
        <FilterForm
          onChange={({ property, value }) => {
            updatePendingFilter(property, value);
          }}
          property={pendingProperty}
          value={pendingValue}
          icon={<AddIcon />}
          onSubmit={() => {
            addPendingFilter();
          }}
        />
      </ListItem>
    </List>
  );
};
FilterList.propTypes = {
  dispatch: PropTypes.func.isRequired,
  state: stateShape.isRequired
};
export default FilterList;
