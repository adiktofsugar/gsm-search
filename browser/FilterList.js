import React, { useCallback } from "react";
import PropTypes from "prop-types";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import AddIcon from "@material-ui/icons/Add";
import ClearIcon from "@material-ui/icons/Clear";
import filterShape from "./shapes/filter";
import filterValuesShape from "./shapes/filterValues";
import FilterForm from "./FilterForm";

const FilterList = ({ state, dispatch }) => {
  const { filters, pendingValues } = state;
  const updateFilter = useCallback(
    (id, values) => {
      dispatch({ type: "update", payload: { id, values } });
    },
    [dispatch]
  );
  const removeFilter = useCallback(
    id => {
      dispatch({ type: "remove", payload: { id } });
    },
    [dispatch]
  );
  const updatePendingFilter = useCallback(
    values => {
      dispatch({ type: "updatePending", payload: { values } });
    },
    [dispatch]
  );
  const addPendingFilter = useCallback(() => {
    dispatch({ type: "addPending", payload: {} });
  }, [dispatch]);
  return (
    <List>
      {filters.map(filter => (
        <ListItem key={filter.id}>
          <FilterForm
            onChange={values => {
              updateFilter(filter.id, values);
            }}
            values={filter.values}
            icon={<ClearIcon />}
            onSubmit={() => {
              removeFilter(filter.id);
            }}
          />
        </ListItem>
      ))}
      <ListItem>
        <FilterForm
          onChange={updatePendingFilter}
          values={pendingValues}
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
  state: PropTypes.shape({
    filters: PropTypes.arrayOf(filterShape).isRequired,
    pendingValues: filterValuesShape.isRequired
  }).isRequired
};
export default FilterList;
