import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Switch from "@material-ui/core/Switch";
import classesShape from "./shapes/classes";
import queries from "./queries";
import getDefaultValueForQuery from "./getDefaultValueForQuery";

const styles = () => ({});

const FilterValueInput = ({ classes, property, value, onChange }) => {
  const query = queries.find(q => q.property === property);
  const onTextFieldChange = useCallback(
    e => {
      onChange(e.target.value);
    },
    [onChange]
  );
  if (!query) {
    return null;
  }
  const realValue =
    value === undefined ? getDefaultValueForQuery(query) : value;
  switch (query.type) {
    case String: {
      return (
        <TextField
          label="Value"
          value={realValue}
          onChange={onTextFieldChange}
          className={classes.textField}
          margin="normal"
        />
      );
    }
    case Boolean: {
      return (
        <Switch
          checked={realValue}
          onChange={() => {
            onChange(!realValue);
          }}
          value={realValue}
          color="primary"
        />
      );
    }
    case Date: {
      return (
        <TextField
          label="Value"
          type="date"
          value={realValue}
          onChange={onTextFieldChange}
          className={classes.textField}
          InputLabelProps={{
            shrink: true
          }}
        />
      );
    }
    case Number: {
      return (
        <TextField
          id="value"
          type="number"
          label="Value"
          value={realValue}
          onChange={onTextFieldChange}
          className={classes.textField}
          margin="normal"
        />
      );
    }
    default:
      return null;
  }
};
FilterValueInput.propTypes = {
  classes: classesShape.isRequired,
  property: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool
  ]),
  onChange: PropTypes.func.isRequired
};
FilterValueInput.defaultProps = {
  property: null,
  value: undefined
};
export default withStyles(styles)(FilterValueInput);
