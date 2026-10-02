import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

interface PositionFieldProps {
  value: string;
  onChange: (position: string) => void;
  /** Existing positions in the organisation, offered as suggestions. */
  options: string[];
  disabled?: boolean;
}

function PositionField({
  value,
  onChange,
  options,
  disabled = false,
}: PositionFieldProps) {
  return (
    <Autocomplete
      freeSolo
      options={options}
      inputValue={value}
      onInputChange={(_event, newInputValue) => onChange(newInputValue)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField {...params} label="Position" required />
      )}
    />
  );
}

export default PositionField;
