import { Client } from '@logux/client'

function login (email, password) {
  let client = new Client({
    subprotocol: 10,
    server: process.env.NODE_ENV === 'development'
      ? 'ws://localhost:31337'
      : 'wss://logux.example.com',
    userId: 'anonymous'
  })
  client.type('login/done', action => {
    localStorage.setItem('userId', action.userId)
    localStorage.setItem('token', action.token)
    location.href = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/dashboard'
      : 'https://app.example.com/dashboard'
  })
  client.type('logux/undo', action => {
    alert(action.reason)
  })
  client.type('html/response', action => {
    console.log(action.text)
  })
  client.start()
  client.log.add({ type: 'login', email, password }, { sync: true })
  client.log.add({ type: 'html/request', text: 'hello server' },{sync: true})
}

export default login