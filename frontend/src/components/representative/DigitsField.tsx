import TextField from "@mui/material/TextField";

interface DigitsFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  disabled?: boolean;
  helperText?: string;
}

function DigitsField({
  label,
  value,
  onChange,
  maxLength,
  disabled = false,
  helperText,
}: DigitsFieldProps) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
      required
      fullWidth
      disabled={disabled}
      helperText={helperText}
      slotProps={{ htmlInput: { inputMode: "numeric", maxLength } }}
    />
  );
}

export default DigitsField;
