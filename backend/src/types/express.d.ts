import type { JwtPayload } from "jsonwebtoken";
import type { AccessTokenPayload } from "../services/authService";

// express-jwt v8 deliberately dropped its own global Express.Request
// augmentation (it broke under strict mode) and instead exports its own
// `Request<T>` type. We restore a plain global augmentation here so
// `req.auth` is available on the standard express.Request everywhere,
// matching expressjwt's default `requestProperty: "auth"`.
//
// Typed as our own `AccessTokenPayload` (sub/username/role) intersected with
// `JwtPayload` (the standard iat/exp/etc. claims jsonwebtoken adds automatically)
// rather than the generic `JwtPayload` alone, so route handlers get real
// autocomplete/type-checking on `req.auth.role` instead of `any`.
declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload & JwtPayload;
    }
  }
}

export {};
