import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-wide safety net. Without this, an uncaught render/effect exception
 * anywhere (e.g. a form-builder preview generation failure) unmounts the
 * entire React tree, leaving the whole page blank with no indication of
 * what went wrong — reproduced by a subsidiary user's ad-hoc form preview
 * throwing and taking the whole app down with it. Catches only render-phase
 * errors (React's own contract for error boundaries) — async errors outside
 * render (e.g. inside a useEffect) still need their own try/catch, as added
 * to FormBuilderPreviewDialog.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8, px: 3 }}>
          <Stack spacing={2} alignItems="center" sx={{ maxWidth: 560, textAlign: "center" }}>
            <Typography variant="h6">Something went wrong</Typography>
            <Typography variant="body2" color="text.secondary" component="pre" sx={{ whiteSpace: "pre-wrap" }}>
              {this.state.error.message}
            </Typography>
            <Button variant="contained" onClick={() => this.setState({ error: null })}>
              Try again
            </Button>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}
