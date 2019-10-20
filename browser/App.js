import React, { useReducer } from "react";
import Typography from "@material-ui/core/Typography";
import FilterList from "./FilterList";
import reducer, { init } from "./reducer";

const App = () => {
  const [state, dispatch] = useReducer(reducer, null, init);
  return (
    <div>
      <Typography variant="h1" gutterBottom>
        Search for phones
      </Typography>
      <FilterList state={state} dispatch={dispatch} />
    </div>
  );
};

export default App;
