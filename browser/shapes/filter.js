import PropTypes from "prop-types";
import filterValues from "./filterValues";

export default PropTypes.shape({
  id: PropTypes.number.isRequired,
  values: filterValues.isRequired
});
