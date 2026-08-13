import AppLayout, { sameerBottomNav } from '../../components/Layout/AppLayout';
import AddEntryForm from '../../components/entries/AddEntryForm';

const navItems = [
  { to: '/sameer', label: 'Dashboard' },
  { to: '/sameer/add-entry', label: 'Add Entry', end: true },
  { to: '/sameer/entries', label: 'My Entries' },
];

export default function AddEntry() {
  return (
    <AppLayout title="Add New Entry" navItems={navItems} bottomNavItems={sameerBottomNav}>
      <AddEntryForm redirectTo="/sameer/entries" />
    </AppLayout>
  );
}
