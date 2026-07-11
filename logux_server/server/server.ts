import { Server } from '@logux/server'
import jwt from 'jwt-simple'//logux.org的这一段把我坑惨了，太难改了，可见基础语法的重要性。7/10
console.log(jwt)
import {SUBPROTOCOL} from '../api/index.js' 


import fs from 'fs'
import readline from 'readline'
const filePath = './db.txt'

const server = new Server(
  Server.loadOptions(process, {
    subprotocol: SUBPROTOCOL,
    minSubprotocol: 1,
    fileUrl: import.meta.url
  })
)

server.auth(({ userId, token }) => {
  if (userId === 'anonymous') {
    return true
  } else {
    try {
      const data = jwt.decode(token, 'secret')
      return data.sub === userId
    } catch (e) {
      return false
    }
  }
})

server.type('login', {
  async access (ctx) {
    return ctx.userId === 'anonymous'
  },
  async process (ctx, action, meta) {
    try {
    // 创建读取流
    const fileStream = fs.createReadStream(filePath, 'utf-8')
    
    // 创建 readline 接口
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity  // 兼容 \r\n 和 \n
    })

    let lineNumber = 0
    // 逐行读取，每读到一行就触发一次
    for await (const line of rl) {
    lineNumber++
    const trimmedLine = line.trim()
    if (line.trim() !== '') {  // 跳过空行
      console.log(`第 ${lineNumber} 行: ${line}`)
    }
    const [demail, pwd] = trimmedLine.split(',')
    if (action.email===demail) {
      if(action.password===pwd) {
      let token = jwt.encode({ sub: action.email }, 'secret')
      ctx.sendBack({ type: 'login/done', userId: action.email, token })
      // 必须定义这个 type，否则 Logux 可能会忽略它或报错
      server.type('html/request', {
        // 1. 权限控制：必须允许访问，否则会被拦截
        access: (ctx, action, meta) => {
          return true;
        },
        // 2. 处理逻辑：在这里才能用 sendBack
        process: (ctx, action, meta) => {
          console.log(action.text)
          console.log('收到请求，准备回复...');
          ctx.sendBack({ type: 'html/response', text: '我是回复内容' });
          
          // 注意：如果是单向通知，不需要再 sendBack html/test，否则会死循环
        }
      });
      break
    } else {
      server.undo(action, meta, 'Wrong password')
    }
  }
    else{
      continue
    }
  }
    } catch (error) {
    console.error('读取失败：', error)
  }
}
}
)



server.listen()