import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";

const styles = () => ({});

const Filter = ({ classes, values, onChange }) => {
  const onFieldChange = name => e => {
    onChange({ ...values, [name]: e.target.value });
  };
  return (
    <>
      <TextField
        id="property"
        label="Property"
        value={values.property || ""}
        onChange={onFieldChange("property")}
        className={classes.textField}
        margin="normal"
      />
      <TextField
        id="comparison"
        label="Compare"
        value={values.comparison || ""}
        onChange={onFieldChange("comparison")}
        className={classes.textField}
        margin="normal"
      />
      <TextField
        id="value"
        label="Value"
        value={values.value || ""}
        onChange={onFieldChange("value")}
        className={classes.textField}
        margin="normal"
      />
    </>
  );
};

Filter.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  values: PropTypes.shape({
    property: PropTypes.string,
    comparison: PropTypes.string,
    value: PropTypes.string
  }).isRequired
};

export default withStyles(styles)(Filter);
