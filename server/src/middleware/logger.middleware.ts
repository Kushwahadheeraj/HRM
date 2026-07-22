// import { Request, Response, NextFunction } from 'express';

// export const logger = (req: Request, res: Response, next: NextFunction) => {
//   const timestamp = new Date().toISOString();
//   console.log(`[${timestamp}] ${req.method} ${req.url}`);
//   next();
// };
import { Request, Response, NextFunction }
from 'express';

export const logger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  console.log(
    `${req.method} ${req.url}`
  );

  next();
};