'use strict'

const bluebird = require('bluebird')
const redis = require('redis')

bluebird.promisifyAll(redis.Multi.prototype)
bluebird.promisifyAll(redis.RedisClient.prototype)

module.exports = redis.createClient(process.env.REDIS_URL)
