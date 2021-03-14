import {Request, Response} from 'express';
import { Redis } from "ioredis";


declare module 'express-session' {
    interface SessionData {
       userId: number;
   }
}

export type MyContext = {
    // em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>,
    req: Request,
    res: Response,
    redisClient: Redis,
}