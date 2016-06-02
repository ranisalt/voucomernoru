'use strict'

import bluebird from 'bluebird'
import redis from 'redis'

bluebird.promisifyAll(redis.Multi.prototype)
bluebird.promisifyAll(redis.RedisClient.prototype)
const client = redis.createClient(process.env.REDIS_URL)

export default client
