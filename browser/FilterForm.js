import React, { useCallback } from "react";
import PropTypes from "prop-types";
import {
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import filterValueShape from "./shapes/filterValue";
import classesShape from "./shapes/classes";
import FilterValueInput from "./FilterValueInput";
import queries from "./queries";

const styles = theme => ({
  form: {
    display: "flex",
    alignItems: "baseline"
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  }
});

const FilterForm = ({ classes, onSubmit, onChange, property, value, icon }) => {
  const onPropertyChange = useCallback(
    e => {
      onChange({ value, property: e.target.value });
    },
    [onChange, value]
  );
  const onValueChange = useCallback(
    newValue => {
      onChange({ property, value: newValue });
    },
    [onChange, property]
  );
  return (
    <form
      className={classes.form}
      onSubmit={e => {
        e.preventDefault();
        onSubmit();
      }}
      autoComplete="off"
    >
      <FormControl className={classes.formControl}>
        <InputLabel>Property</InputLabel>
        <Select value={property} onChange={onPropertyChange}>
          {queries.map(q => (
            <MenuItem key={q.property} value={q.property}>
              {q.property}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl className={classes.formControl}>
        <FilterValueInput
          property={property}
          value={value}
          onChange={onValueChange}
        />
      </FormControl>
      <IconButton type="submit">{icon}</IconButton>
    </form>
  );
};
FilterForm.propTypes = {
  classes: classesShape.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  property: PropTypes.string,
  value: filterValueShape,
  icon: PropTypes.element.isRequired
};
FilterForm.defaultProps = {
  property: "",
  value: undefined
};
export default withStyles(styles)(FilterForm);
