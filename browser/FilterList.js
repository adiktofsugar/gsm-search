import React, { useCallback } from "react";
import PropTypes from "prop-types";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import IconButton from "@material-ui/core/IconButton";
import AddIcon from "@material-ui/icons/Add";
import ClearIcon from "@material-ui/icons/Clear";
import { withStyles } from "@material-ui/core/styles";
import Filter from "./Filter";

const styles = () => ({
  form: {
    display: "flex",
    alignItems: "center"
  }
});

const FilterList = ({ state, dispatch, classes }) => {
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
          <form
            className={classes.form}
            onSubmit={e => {
              e.preventDefault();
              removeFilter(filter.id);
            }}
            autoComplete="off"
          >
            <Filter
              onChange={values => {
                updateFilter(filter.id, values);
              }}
              values={filter.values}
            />
            <IconButton type="submit">
              <ClearIcon />
            </IconButton>
          </form>
        </ListItem>
      ))}
      <ListItem>
        <form
          className={classes.form}
          onSubmit={e => {
            e.preventDefault();
            addPendingFilter();
          }}
          autoComplete="off"
        >
          <Filter onChange={updatePendingFilter} values={pendingValues} />
          <IconButton type="submit">
            <AddIcon />
          </IconButton>
        </form>
      </ListItem>
    </List>
  );
};
FilterList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  state: PropTypes.shape({
    filters: PropTypes.array.isRequired,
    pendingValues: PropTypes.object.isRequired
  }).isRequired
};
export default withStyles(styles)(FilterList);
