const md5 = require('js-md5')
const SALT = 'I AM FW'

export function md5Encrypt (msg) {
  msg += SALT
  return md5(msg)
}
