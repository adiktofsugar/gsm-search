import PropTypes from "prop-types";
import filterValue from "./filterValue";

export default PropTypes.shape({
  property: PropTypes.string.isRequired,
  value: filterValue.isRequired
});
