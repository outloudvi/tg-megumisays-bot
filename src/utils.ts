import types from '@grammyjs/types'

export function describeUser(u: types.User): String {
  return `${u.first_name}${u.last_name ? ' ' + u.last_name : ''} (#${u.id})`
}
