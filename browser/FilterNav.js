import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { withStyle } from "@material-ui/core/styles";
import { Grid, FormControlLabel, Switch } from "@material-ui/core";
import classesShape from "./shapes/classes";
import stateShape from "./shapes/state";

const style = () => ({});
const FilterNav = ({ classes, state, dispatch }) => {
  const getFilterValue = useCallback(
    (property, defaultValue) => {
      const filter = state.filters.find(
        ({ values }) => values.property === property
      );
      if (filter) {
        return filter.values.value;
      }
      return defaultValue;
    },
    [state.filters]
  );
  const handleAvailableChange = event => {
    const isAvailable = event.target.checked;
    dispatch({
      type: "upsert",
      payload: {
        property: "available",
        value: isAvailable
      }
    });
  };
  return (
    <Grid container>
      <Grid item xs={3}>
        <FormControlLabel
          label="available"
          control={
            <Switch
              checked={getFilterValue("available", false)}
              onChange={handleAvailableChange}
              value="true"
            />
          }
        />
      </Grid>
      <Grid item xs={3}>
        <MinMemoryFilter />
      </Grid>
      <Grid item xs={3}>
        <MinYearFilter />
      </Grid>
      <Grid item xs={3}>
        <MinWidthFilter />
      </Grid>
    </Grid>
  );
};

FilterNav.propTypes = {
  classes: classesShape.isRequired,
  state: stateShape.isRequired,
  dispatch: PropTypes.func.isRequired
};
export default withStyle(style)(FilterNav);
