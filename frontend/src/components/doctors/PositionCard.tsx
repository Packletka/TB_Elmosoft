import { Link as RouterLink, createSearchParams } from "react-router-dom";

import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

interface PositionCardProps {
  organisationId: number;
  position: string;
}

function PositionCard({ organisationId, position }: PositionCardProps) {
  const searchParams = createSearchParams({
    position: position,
  });

  return (
    <Card>
      <CardActionArea
        component={RouterLink}
        to={{
          pathname: `/organisations/${organisationId}/doctors`,
          search: searchParams.toString(),
        }}
      >
        <CardContent>
          <Typography variant="h6" component="h3">
            {position}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default PositionCard;
