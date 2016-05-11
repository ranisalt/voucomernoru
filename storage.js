'use strict'

import bluebird from 'bluebird'
import redis from 'redis'

bluebird.promisifyAll(redis.RedisClient.prototype)
const client = redis.createClient()

export default client
