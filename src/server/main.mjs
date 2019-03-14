
import Koa from 'koa'
import jwt from 'koa-jwt'
import Router from 'koa-router'
import cors from '@koa/cors'
import jwks from 'jwks-rsa'
import { AUTH_ISSUER, API_PORT } from '../common/config.mjs'

const app = new Koa()
const router = new Router()

app.context.user = null;

const secret = jwks.koaJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `${AUTH_ISSUER}/v1/keys`
})

router.get('/api', ctx => {
    console.dir(ctx.state.user)
    ctx.body = {
        status: 200,
        id: Math.random().toString(16).substr(2),
        user: ctx.state.user.sub,
    }
})

app.use(async (ctx, next) => {
    try {
        await next()
    } catch(err) {
        const status = err.status || 500
        ctx.status = status
        ctx.body = {
            status,
            error: err.message,
        }
    }
})

app.use(cors())
app.use(jwt({ secret }).unless({ method: 'OPTIONS' }))
app.use(router.allowedMethods())
app.use(router.routes())

app.listen(API_PORT)
console.log(`Server running on port ${API_PORT}`)

