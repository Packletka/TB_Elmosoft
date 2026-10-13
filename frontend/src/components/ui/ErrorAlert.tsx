import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

interface ErrorAlertProps {
  messages: string[];
}

// One message reads as a sentence, several as a list: the server reports every broken password rule at once
function ErrorAlert({ messages }: ErrorAlertProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <Alert severity="error">
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </Box>
      )}
    </Alert>
  );
}

export default ErrorAlert;
