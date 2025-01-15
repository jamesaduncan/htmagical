import logger from "https://deno.land/x/oak_logger/mod.ts";
import { Application, Router } from "jsr:@oak/oak";
import htmagical from "./htmagical.js";


const app = new Application();
const router = new Router();


app.use(logger.logger)
app.use(logger.responseTime)

app.use( htmagical );

app.use( async (ctx, next) => {
    try {
        await ctx.send({
            root: 'static',
            index: 'index.html'
        })
    } catch (e) {
        await next();
    }
});

app.use(router.routes())
app.use(router.allowedMethods());

app.listen({ port: 9001 });