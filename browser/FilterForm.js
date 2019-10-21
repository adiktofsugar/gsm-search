import React from "react";
import PropTypes from "prop-types";
import IconButton from "@material-ui/core/IconButton";
import { withStyles } from "@material-ui/core/styles";
import filterValuesShape from "./shapes/filterValues";
import classesShape from "./shapes/classes";
import Filter from "./Filter";

const styles = () => ({
  form: {
    display: "flex",
    alignItems: "baseline"
  }
});

const FilterForm = ({ classes, onSubmit, onChange, values, icon }) => (
  <form
    className={classes.form}
    onSubmit={e => {
      e.preventDefault();
      onSubmit();
    }}
    autoComplete="off"
  >
    <Filter onChange={onChange} values={values} />
    <IconButton type="submit">{icon}</IconButton>
  </form>
);
FilterForm.propTypes = {
  classes: classesShape.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  values: filterValuesShape.isRequired,
  icon: PropTypes.element.isRequired
};
export default withStyles(styles)(FilterForm);
