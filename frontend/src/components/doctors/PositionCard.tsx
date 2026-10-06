import { Link as RouterLink, createSearchParams } from "react-router-dom";

import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

interface PositionCardProps {
  organisationId: number;
  position: string;
  /** Where the card links to. Defaults to the public doctors list of the organisation. */
  to?: string;
}

function PositionCard({ organisationId, position, to }: PositionCardProps) {
  const searchParams = createSearchParams({
    position: position,
  });

  return (
    <Card>
      <CardActionArea
        component={RouterLink}
        to={
          to ?? {
            pathname: `/organisations/${organisationId}/doctors`,
            search: searchParams.toString(),
          }
        }
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
