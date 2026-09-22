import { Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  /** Omit on the last (current-page) item — rendered as plain text, not a link. */
  to?: string;
}

/** A small "Section > Current page" trail shown above a page's own
 * PageHeader — purely navigational context (which list this page belongs
 * under), not a replacement for PageHeader's own back button/title. */
export function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <Breadcrumbs sx={{ mb: 1 }}>
      {items.map((item, i) =>
        item.to ? (
          <MuiLink key={i} component={RouterLink} to={item.to} underline="hover" color="inherit" variant="body2">
            {item.label}
          </MuiLink>
        ) : (
          <Typography key={i} variant="body2" color="text.primary" noWrap>
            {item.label}
          </Typography>
        ),
      )}
    </Breadcrumbs>
  );
}
