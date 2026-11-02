import SavedNameDropdownField from './SavedNameDropdownField';

export default function NamePickerInput(props) {
  const nameType = props.storageKey === 'source' ? 'source' : 'customer';

  return (
    <SavedNameDropdownField
      {...props}
      nameType={nameType}
      showAddButton
    />
  );
}
