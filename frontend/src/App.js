import "./App.css";
import { useState } from "react";
import AuthScreen from "./components/AuthScreen.jsx";
import EmployeeDashboard from "./components/EmployeeDashBoard.jsx";
import ManagerDashboard from "./components/ManagerDashBoard.jsx";
import { UserProvider } from "./context/UserProvider.jsx";
import { useContext } from "react";
import { UserContext } from "./context/UserProvider";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { createTheme, ThemeProvider } from '@mui/material/styles';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(UserContext);
  return isAuthenticated ? <>{children}</> : <Navigate replace to="/signin" />;
};

// Example with Inter
const theme = createTheme({
  typography: {
    fontFamily: [
      'Poppins',
    ],
  },
});

function App() {
  const [isAuthenticated, isUserAuthenticated] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <UserProvider>
        <AppRoutes isAuthenticated={isAuthenticated} isUserAuthenticated={isUserAuthenticated} />
      </UserProvider>
    </ThemeProvider>
  );
}

function AppRoutes({ isAuthenticated, isUserAuthenticated }) {
  const { user } = useContext(UserContext);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              user && user.role === "manager" ? (
                <Navigate to="/manager/dashboard" replace />
              ) : user && user.role === "employee" ? (
                <Navigate to="/employee/dashboard" replace />
              ) : (
                <Navigate to="/signin" replace />
              )
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/signin"
          element={<AuthScreen isUserAuthenticated={isUserAuthenticated} />}
        />
        <Route
          path="/manager/dashboard"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <ManagerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/employee/dashboard"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
