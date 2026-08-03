import type { JwtPayload } from "jsonwebtoken";

// express-jwt v8 deliberately dropped its own global Express.Request
// augmentation (it broke under strict mode) and instead exports its own
// `Request<T>` type. We restore a plain global augmentation here so
// `req.auth` is available on the standard express.Request everywhere,
// matching expressjwt's default `requestProperty: "auth"`.
declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export {};
