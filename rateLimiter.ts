import { RequestHandler, Request, Response, NextFunction } from "express";

let callCount = 0;
interface LimitOptions {
  count: number;
  firstRequestTime?: number; // time in second
}

const defaultLimit: LimitOptions = {
  count: 1,
};
const TIME_LIMIT = 15 * 1000; // 15 seconds
const REQ_LIMIT = 5;
const requests = new Map<string, Map<string, LimitOptions>>();
// const ipCountMap = new Map<string, LimitOptions>();

export function limit(): MethodDecorator {
  return function (
    _: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod: RequestHandler = descriptor.value;

    descriptor.value = async function (
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      console.log(`Starting ${propertyKey.toString()}`);
      const ip = req.ip;
      console.log(`IP ${ip}`);

      let count: number = 0;

      let ipCountMap = requests.get(propertyKey.toString());
      if (!ipCountMap) {
        ipCountMap = new Map<string, LimitOptions>();
        ipCountMap.set(ip, { count: 1, firstRequestTime: Date.now() });
        requests.set(propertyKey.toString(), ipCountMap);
      }
      let limitOptions = ipCountMap.get(ip);

      if (!limitOptions) {
        limitOptions = defaultLimit;
        limitOptions.firstRequestTime = Date.now();
      }

      count = limitOptions.count || 0;
      count++;

      const firstReqTime: number = limitOptions.firstRequestTime || 0;
      const timeAfterFirstCall = Date.now() - firstReqTime;
      console.log(`Time after first call ${timeAfterFirstCall / 1000}s`);
      console.log(limitOptions);
      limitOptions.count = count;
      if (count > REQ_LIMIT && timeAfterFirstCall < TIME_LIMIT) {
        return res
          .status(403)
          .send(
            `"Rate Limited...". Time after first call ${
              timeAfterFirstCall / 1000
            }s`
          );
      } else if (timeAfterFirstCall > TIME_LIMIT || count > REQ_LIMIT) {
        console.log("Time updated...");
        limitOptions = {
          count: 1,
          firstRequestTime: Date.now(),
        };
        ipCountMap.set(ip, limitOptions);
        console.log({ limitOptions });
      }

      //   limitOptions.count = count;
      ipCountMap.set(ip, limitOptions);
      console.log(ipCountMap);

      requests.set(propertyKey.toString(), ipCountMap);

      const response: any = await originalMethod.apply(this, [req, res, next]);
      console.log(response.statusCode);
    };

    return descriptor;
  };
}
