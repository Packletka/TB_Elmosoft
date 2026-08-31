import { Link as RouterLink } from "react-router-dom";

import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

interface OrganisationCardProps {
  id: number;
  name: string;
  address: string;
}

function OrganisationCard({ id, name, address }: OrganisationCardProps) {
  return (
    <Card>
      <CardActionArea component={RouterLink} to={`/organisations/${id}`}>
        <CardContent>
          <Typography variant="h6" component="h2">
            {name}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {address}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default OrganisationCard;
