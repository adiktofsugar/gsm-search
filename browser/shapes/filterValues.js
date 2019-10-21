import PropTypes from "prop-types";

export default PropTypes.shape({
  property: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string])
});
