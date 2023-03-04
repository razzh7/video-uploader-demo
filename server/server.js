const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const path = require('path')
const CryptoJS = require('crypto-js')
const bodyParser = require('body-parser')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
const formatVideo = require('./util')
const {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  access,
  unlinkSync,
  rmdirSync,
} = require('fs')

const app = express()
const PORT = 6003
// 设置跨域
app.use(cors())

// 设置静态目录
app.use(express.static(path.resolve(__dirname, './video')))

// 处理POST请求
app.use(bodyParser.urlencoded({ extended: true }))

// 使用express-fileupload
app.use(fileUpload())

ffmpeg.setFfmpegPath(ffmpegPath)

const tempDir = path.resolve(__dirname, './temp')
const videoDir = path.resolve(__dirname, './video')

app.post('/upload', (req, res) => {
  const { fileName, fileType, chunkName } = req.body
  const { chunk } = req.files
  // 根据fileName生成hash文件夹名字
  const hashFolderName = CryptoJS.MD5(fileName),
    tempFolderPath = `${tempDir}/${hashFolderName}`,
    chunkFilePath = `${tempFolderPath}/${chunkName}`

  if (!existsSync(tempFolderPath)) {
    mkdirSync(tempFolderPath)
  }

  access(chunkFilePath, (err) => {
    // 文件秒传，如果已经存在就直接return，无需再次写入
    if (!err) {
      res.send({
        code: 200,
        msg: '文件已经存在，无需再上传',
        hashFolderName: hashFolderName.toString(),
      })
      return
    }

    // 不存在再写入temp文件夹中
    writeFileSync(chunkFilePath, chunk.data)

    res.send({
      code: 200,
      msg: '上传成功',
      hashFolderName: hashFolderName.toString(),
    })
  })
})

app.get('/merge', (req, res) => {
  const { hashFolderName } = req.query,
    fileList = readdirSync(`${tempDir}/${hashFolderName}`),
    tempFolderPath = `${tempDir}/${hashFolderName}`,
    videoFolderDir = `${videoDir}/${hashFolderName}`,
    videoPath = `${videoFolderDir}/${hashFolderName}.mp4`,
    hlsPath = `${videoFolderDir}/${hashFolderName}.m3u8`

  if (!existsSync(videoFolderDir)) {
    mkdirSync(videoFolderDir)
  }
  fileList.sort((a, b) => {
    const reg = /_(\d+)/
    return reg.exec(a)[1] - reg.exec(b)[1]
  })
  fileList.forEach((item) => {
    const chunkContent = readFileSync(`${tempFolderPath}/${item}`)

    // 先检查文件是否存在，不存在先创建再添加
    if (!existsSync(videoPath)) {
      writeFileSync(videoPath, chunkContent)
    } else {
      appendFileSync(videoPath, chunkContent)
    }
    // chunk写入后删除该chunk
    unlinkSync(`${tempFolderPath}/${item}`)
  })
  // 删除temp下的hash文件夹
  rmdirSync(tempFolderPath)

  // 转码m3u8
  formatVideo(videoPath, {
    videoCodec: 'libx264',
    format: 'hls',
    outputOptions: '-hls_list_size 0',
    outputOption: '-hls_time 5',
    output: hlsPath,
    onError(e) {
      console.log('错误', e)
    },
    onEnd() {
      res.send({
        code: 0,
        msg: 'Upload successfully',
        videoSrc: `http://localhost:${PORT}/${hashFolderName}/${hashFolderName}.m3u8`,
      })
    },
  })
})

app.listen(PORT, () => {
  console.log(`服务已经启动: http://localhost:${PORT}`)
})
