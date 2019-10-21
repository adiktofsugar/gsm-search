import React, { useReducer } from "react";
import { ApolloProvider } from "@apollo/react-hooks";
import Typography from "@material-ui/core/Typography";
import FilterList from "./FilterList";
import PhoneList from "./PhoneList";
import reducer, { init } from "./reducer";
import client from "./client";

const App = () => {
  const [state, dispatch] = useReducer(reducer, null, init);
  return (
    <ApolloProvider client={client}>
      <div>
        <Typography component="h1" variant="h2" gutterBottom>
          Search for phones
        </Typography>
        <FilterList state={state} dispatch={dispatch} />
        {state.filters.length ? <PhoneList filters={state.filters} /> : null}
      </div>
    </ApolloProvider>
  );
};

export default App;
