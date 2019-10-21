import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {
  Grid,
  IconButton,
  ListSubheader,
  ButtonGroup
} from "@material-ui/core";
import NavigateNextIcon from "@material-ui/icons/NavigateNext";
import NavigateBeforeIcon from "@material-ui/icons/NavigateBefore";
import classesShape from "./shapes/classes";

const style = () => ({
  buttonGrid: {
    justifyContent: "flex-end",
    display: "flex"
  }
});

const PhoneListPagination = ({
  classes,
  count,
  page,
  handleNextClick,
  handlePreviousClick
}) => {
  const isOnFirstPage = page === 0;
  const lastPage = Math.floor(count / 10);
  const isOnLastPage = page === lastPage;
  const start = page * 10;
  const end = start + 10;
  return (
    <ListSubheader component="div">
      <Grid container spacing={3}>
        <Grid item xs={6}>
          {start} - {end} of {count}
        </Grid>
        <Grid className={classes.buttonGrid} item xs={6}>
          <ButtonGroup size="small">
            <IconButton disabled={isOnFirstPage} onClick={handlePreviousClick}>
              <NavigateBeforeIcon />
            </IconButton>
            <IconButton disabled={isOnLastPage} onClick={handleNextClick}>
              <NavigateNextIcon />
            </IconButton>
          </ButtonGroup>
        </Grid>
      </Grid>
    </ListSubheader>
  );
};

PhoneListPagination.propTypes = {
  classes: classesShape.isRequired,
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  handleNextClick: PropTypes.func.isRequired,
  handlePreviousClick: PropTypes.func.isRequired
};

export default withStyles(style)(PhoneListPagination);
