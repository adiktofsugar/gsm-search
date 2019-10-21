import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {
  Grid,
  FormControlLabel,
  FormControl,
  Input,
  InputAdornment,
  InputLabel,
  Switch
} from "@material-ui/core";
import classesShape from "./shapes/classes";
import stateShape from "./shapes/state";

const style = () => ({
  rangeFormControl: {
    width: "8em"
  }
});
const FilterNav = ({ classes, state, dispatch }) => {
  const getFilterValue = useCallback(
    (property, defaultValue) => {
      const filter = state.filters.find(f => f.property === property);
      if (filter) {
        return filter.value;
      }
      return defaultValue;
    },
    [state.filters]
  );
  const handleBooleanChange = property => event => {
    const value = event.target.checked;
    dispatch({
      type: "upsert",
      payload: {
        property,
        value
      }
    });
  };
  const handleYearChange = property => event => {
    const year = event.target.value.padStart(4, "0");
    const value = `${year}-01-01`;
    dispatch({
      type: "upsert",
      payload: {
        property,
        value
      }
    });
  };
  const handleNumberChange = property => event => {
    dispatch({
      type: "upsert",
      payload: {
        property,
        value: event.target.value
      }
    });
  };
  const minReleasedDate = getFilterValue(
    "minReleased",
    `${new Date().getFullYear()}-01-01`
  );
  const minYear = minReleasedDate.split("-")[0].replace(/^0+/, "");
  return (
    <Grid container>
      <Grid item xs={3}>
        <FormControlLabel
          label="available"
          control={
            <Switch
              checked={getFilterValue("available", false)}
              onChange={handleBooleanChange("available")}
              value="true"
            />
          }
        />
      </Grid>
      <Grid item xs={3}>
        <FormControl>
          <InputLabel>Memory</InputLabel>
          <Input
            type="number"
            value={getFilterValue("minMemoryGb", 0)}
            onChange={handleNumberChange("minMemoryGb")}
            startAdornment={
              <InputAdornment position="start">&gt;=</InputAdornment>
            }
            endAdornment={<InputAdornment position="end">GB</InputAdornment>}
          />
        </FormControl>
      </Grid>
      <Grid item xs={3}>
        <FormControl>
          <InputLabel>Year</InputLabel>
          <Input
            type="number"
            value={minYear}
            onChange={handleYearChange("minReleased")}
            startAdornment={
              <InputAdornment position="start">&gt;=</InputAdornment>
            }
          />
        </FormControl>
      </Grid>
      <Grid item xs={3}>
        <Grid container>
          <Grid item xs={6}>
            <FormControl className={classes.rangeFormControl}>
              <InputLabel>Min Width</InputLabel>
              <Input
                type="number"
                value={getFilterValue("minSizeWidth", 0)}
                onChange={handleNumberChange("minSizeWidth")}
                startAdornment={
                  <InputAdornment position="start">&gt;=</InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">cm</InputAdornment>
                }
              />
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl className={classes.rangeFormControl}>
              <InputLabel>Max Width</InputLabel>
              <Input
                type="number"
                value={getFilterValue("maxSizeWidth", 0)}
                onChange={handleNumberChange("maxSizeWidth")}
                startAdornment={
                  <InputAdornment position="start">&lt;=</InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">cm</InputAdornment>
                }
              />
            </FormControl>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

FilterNav.propTypes = {
  classes: classesShape.isRequired,
  state: stateShape.isRequired,
  dispatch: PropTypes.func.isRequired
};
export default withStyles(style)(FilterNav);
