import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useQuery } from "@apollo/react-hooks";
import { gql } from "apollo-boost";
import { withStyles } from "@material-ui/core/styles";
import {
  Typography,
  GridList,
  GridListTile,
  GridListTileBar,
  IconButton
} from "@material-ui/core";
import LinkIcon from "@material-ui/icons/Link";
import filterShape from "./shapes/filter";
import classesShape from "./shapes/classes";
import queries from "./queries";
import PhoneListPagination from "./PhoneListPagination";

const PIC_BASE = "http://cdn2.gsmarena.com/vv/bigpic/";
function cleanURL(s) {
  return s.toLowerCase().replace(/\s+|-|\/|\./g, "_");
}

const style = () => ({
  image: {
    display: "block"
  }
});

const PhoneList = ({ classes, filters }) => {
  const [page, setPage] = useState(0);
  const queryArgs = filters
    .map(({ property, value }) => {
      const query = queries.find(q => q.property === property);
      let realValue;
      switch (query.type) {
        case Boolean:
        case Number:
          realValue = value;
          break;
        default:
          realValue = `"${value}"`;
          break;
      }
      return `${property}: ${realValue}`;
    })
    .concat([`page: ${page}`])
    .join(", ");
  const query = `
  query {
    phones(${queryArgs}) {
      count
      results {
        id
        name
        makerName
        thumb
      }
    }
  }`;
  const { error, loading, data } = useQuery(gql(query));
  const handlePreviousClick = useCallback(e => {
    e.preventDefault();
    setPage(current => current - 1);
  }, []);
  const handleNextClick = useCallback(e => {
    e.preventDefault();
    setPage(current => current + 1);
  }, []);
  useEffect(() => {
    if (data && data.phones && data.phones.count < page * 10) {
      setPage(0);
    }
  }, [data, page]);
  if (loading) {
    return <Typography variant="subtitle1">loading</Typography>;
  }
  if (error) {
    return <Typography variant="subtitle1">{String(error)}</Typography>;
  }
  const { count, results } = data.phones;
  const paginationProps = {
    count,
    page,
    handleNextClick,
    handlePreviousClick
  };
  return (
    <React.Fragment>
      <GridList cellHeight={180} className={classes.gridList}>
        <GridListTile cols={2} style={{ height: "auto" }}>
          <PhoneListPagination {...paginationProps} />
        </GridListTile>
        {results.map(({ id, makerName, name, thumb }) => {
          const href = `http://www.gsmarena.com/${cleanURL(
            makerName
          )}_${cleanURL(name)}-${id}.php`;
          return (
            <GridListTile key={id}>
              <img
                className={classes.image}
                alt={name}
                src={`${PIC_BASE}${thumb}`}
              />
              <GridListTileBar
                title={name}
                subtitle={makerName}
                actionIcon={
                  <IconButton href={href}>
                    <LinkIcon color="secondary" />
                  </IconButton>
                }
              />
            </GridListTile>
          );
        })}
        <GridListTile cols={2} style={{ height: "auto" }}>
          <PhoneListPagination {...paginationProps} />
        </GridListTile>
      </GridList>
    </React.Fragment>
  );
};

PhoneList.propTypes = {
  classes: classesShape.isRequired,
  filters: PropTypes.arrayOf(filterShape).isRequired
};
export default withStyles(style)(PhoneList);
