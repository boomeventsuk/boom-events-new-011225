import { Navigate } from "react-router-dom";

const TicketsRedirect = () => {
  return <Navigate to="/#tickets" replace={true} />;
};

export default TicketsRedirect;