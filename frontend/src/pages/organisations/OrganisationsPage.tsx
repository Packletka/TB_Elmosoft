import { useEffect, useState } from "react";

import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import OrganisationCard from "../../components/organisations/OrganisationCard";
import { organisationApi } from "../../api/organisations";
import { extractErrorMessages } from "../../api/errorMessages";
import type { HealthOrganisationResponse } from "../../types/api/healthOrganisation";

function OrganisationsPage() {
  const [search, setSearch] = useState("");
  const [organisations, setOrganisations] = useState<
    HealthOrganisationResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    organisationApi
      .getOrganisations()
      .then((res) => {
        if (!cancelled) setOrganisations(res.data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(extractErrorMessages(err).join(" "));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
        disabled={isLoading || !!loadError}
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

      {isLoading && (
        <Stack sx={{ alignItems: "center", py: 4 }}>
          <CircularProgress />
        </Stack>
      )}

      {loadError && <Alert severity="error">{loadError}</Alert>}

      {!isLoading && !loadError && (
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
      )}
    </>
  );
}

export default OrganisationsPage;
