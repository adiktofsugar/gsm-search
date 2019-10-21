import { format } from "date-fns";
import dateFormat from "./dateFormat";

export default query => {
  switch (query.type) {
    case Boolean:
      return false;
    case Date:
      return format(new Date(), dateFormat);
    default:
      return "";
  }
};
