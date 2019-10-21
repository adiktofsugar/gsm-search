import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import filterValues from "./shapes/filterValues";
import classesShape from "./shapes/classes";
import FilterValueInput from "./FilterValueInput";
import queries from "./queries";

const styles = theme => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  }
});

const Filter = ({ classes, values, onChange }) => {
  const onPropertyChange = useCallback(
    e => {
      const property = e.target.value;
      onChange({ ...values, property });
    },
    [onChange, values]
  );
  const onValueChange = useCallback(value => {
    onChange({ ...values, value });
  });
  return (
    <React.Fragment>
      <FormControl className={classes.formControl}>
        <InputLabel>Property</InputLabel>
        <Select value={values.property} onChange={onPropertyChange}>
          {queries.map(({ property }) => (
            <MenuItem key={property} value={property}>
              {property}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl className={classes.formControl}>
        <FilterValueInput
          property={values.property}
          value={values.value}
          onChange={onValueChange}
        />
      </FormControl>
    </React.Fragment>
  );
};

Filter.propTypes = {
  classes: classesShape.isRequired,
  onChange: PropTypes.func.isRequired,
  values: filterValues.isRequired
};

export default withStyles(styles)(Filter);
