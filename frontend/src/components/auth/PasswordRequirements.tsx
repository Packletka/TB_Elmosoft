import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Mirrors AUTH_PASSWORD_VALIDATORS in backend/talonby/settings.py (MinimumLengthValidator, NumericPasswordValidator,
// CommonPasswordValidator, UserAttributeSimilarityValidator). It is only a hint: the server is the judge and its
// answer is shown when a password is refused. A change to the rules there needs a change here
const MIN_LENGTH = 8;

const REQUIREMENTS = [
  `has at least ${MIN_LENGTH} characters`,
  "is not only digits",
  "is not a commonly used password, such as password or 12345678",
  "is not too similar to your name or email",
];

function PasswordRequirements() {
  return (
    <Typography variant="body2" color="text.secondary" component="div">
      Your new password:
      <Box component="ul" sx={{ m: 0, pl: 3 }}>
        {REQUIREMENTS.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </Box>
    </Typography>
  );
}

export default PasswordRequirements;
