import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import HomePage, { FallbackRedirect } from './HomePage';

import Login from '../pages/Login';
import SameerDashboard from '../pages/sameer/SameerDashboard';
import AddEntry from '../pages/sameer/AddEntry';
import MyEntries from '../pages/sameer/MyEntries';
import SameerEntryDetails from '../pages/sameer/SameerEntryDetails';
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import OwnerAddEntry from '../pages/owner/AddEntry';
import AllEntries from '../pages/owner/AllEntries';
import PendingSettlements from '../pages/owner/PendingSettlements';
import MonthlyReport from '../pages/owner/MonthlyReport';
import EntryDetails from '../pages/owner/EntryDetails';
import EditEntry from '../pages/owner/EditEntry';
import ChangePassword from '../pages/owner/ChangePassword';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/sameer"
        element={
          <ProtectedRoute>
            <RoleRoute role="sameer">
              <SameerDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sameer/add-entry"
        element={
          <ProtectedRoute>
            <RoleRoute role="sameer">
              <AddEntry />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sameer/entries"
        element={
          <ProtectedRoute>
            <RoleRoute role="sameer">
              <MyEntries />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sameer/entries/:id"
        element={
          <ProtectedRoute>
            <RoleRoute role="sameer">
              <SameerEntryDetails />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/owner"
        element={
          <ProtectedRoute>
            <RoleRoute role="owner">
              <OwnerDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/add-entry"
        element={
          <ProtectedRoute>
            <RoleRoute role="owner">
              <OwnerAddEntry />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/entries"
        element={
          <ProtectedRoute>
            <RoleRoute role="owner">
              <AllEntries />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/pending"
        element={
          <ProtectedRoute>
            <RoleRoute role="owner">
              <PendingSettlements />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/reports"
        element={
          <ProtectedRoute>
            <RoleRoute role="owner">
              <MonthlyReport />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/entries/:id/edit"
        element={
          <ProtectedRoute>
            <RoleRoute role="owner">
              <EditEntry />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/entries/:id"
        element={
          <ProtectedRoute>
            <RoleRoute role="owner">
              <EntryDetails />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/owner/change-password"
        element={
          <ProtectedRoute>
            <RoleRoute role="owner">
              <ChangePassword />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}
