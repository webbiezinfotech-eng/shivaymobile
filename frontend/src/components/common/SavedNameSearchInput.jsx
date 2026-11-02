import SavedNameDropdownField from './SavedNameDropdownField';

export default function SavedNameSearchInput(props) {
  return (
    <SavedNameDropdownField
      {...props}
      nameType="all"
      showAddButton={false}
      placeholder={props.placeholder || 'Saved name select karein'}
    />
  );
}
