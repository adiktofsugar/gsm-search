import PropTypes from "prop-types";
import filterShape from "./filter";
import filterValueShape from "./filterValue";

export default PropTypes.shape({
  filters: PropTypes.arrayOf(filterShape).isRequired,
  pendingValue: filterValueShape,
  pendingProperty: PropTypes.string
});
