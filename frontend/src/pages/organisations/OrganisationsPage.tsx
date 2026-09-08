import { useState } from "react";

import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import OrganisationCard from "../../components/organisations/OrganisationCard";
import { organisations } from "../../mocks/organisations";

function OrganisationsPage() {
  const [search, setSearch] = useState("");

  const filteredOrganisations = organisations.filter((organisation) =>
    organisation.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Typography variant="h4" component="h1">
        Health Organisations
      </Typography>

      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Find organisation needed"
        variant="outlined"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      <Stack spacing={2}>
        {filteredOrganisations.length > 0 ? (
          filteredOrganisations.map((organisation) => (
            <OrganisationCard
              key={organisation.id}
              id={organisation.id}
              name={organisation.name}
              address={organisation.address}
            />
          ))
        ) : (
          <Typography color="text.secondary">
            No organisations found.
          </Typography>
        )}
      </Stack>
    </>
  );
}

export default OrganisationsPage;
