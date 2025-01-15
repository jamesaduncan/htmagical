import logger from "https://deno.land/x/oak_logger/mod.ts";
import { Application, Router } from "jsr:@oak/oak";
import htmagical from "./htmagical.js";


const app = new Application();

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

app.addEventListener('listen', (params) => {
    const { serverType, hostname, port } = params;
    console.log( params );
    console.log(`listening on http://${hostname}:${port}`);
});

app.listen({ port: 9001 });