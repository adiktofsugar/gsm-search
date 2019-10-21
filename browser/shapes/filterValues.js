import PropTypes from "prop-types";
import filterValueShape from "./filterValue";

export default PropTypes.shape({
  property: PropTypes.string,
  value: filterValueShape
});
