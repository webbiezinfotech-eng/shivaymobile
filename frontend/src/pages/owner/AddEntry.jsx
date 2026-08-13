import AppLayout, { ownerBottomNav } from '../../components/Layout/AppLayout';
import { ownerNavItems } from '../../config/ownerNav';
import AddEntryForm from '../../components/entries/AddEntryForm';

export default function AddEntry() {
  return (
    <AppLayout title="Add New Entry" navItems={ownerNavItems} bottomNavItems={ownerBottomNav}>
      <AddEntryForm redirectTo="/owner/entries" />
    </AppLayout>
  );
}
