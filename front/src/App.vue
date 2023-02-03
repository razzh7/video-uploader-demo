<template>
  <div>
    <el-upload
      drag
      action
      multiple
      :show-file-list="false"
      :auto-upload="false"
      :on-change="uploadVideo"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        拖拽文件 或 <em>点击上传</em>
      </div>
    </el-upload>
    <div class="status">
      <el-progress :text-inside="true" :stroke-width="26" :percentage="processSize" />
    </div>
    <div class="status" v-if="videoProcess">转码中...</div>
    <div class="btn" v-if="btnShow">
      <el-button v-if="!btnStatus" @click="switchUploader">暂停</el-button>
      <el-button v-if="btnStatus" @click="uploadVideo">开始</el-button>
    </div>

    <div id="video-player"></div>
  </div>
</template> 

<script setup>
import { UploadFilled } from '@element-plus/icons-vue'
import CryptoJS from 'crypto-js'
import { http } from './util.js'
import { $ref } from "vue/macros";
import HlsPlayer from 'xgplayer-hls';

let btnText = $ref('暂停'),
    btnShow = $ref(true),
    btnStatus = $ref(false),
    videoProcess = $ref(false),
    processSize = $ref(0),
    hashFileName = $ref(''),
    files = null

const uploadVideo = async (file) => {
  btnShow = true
  if (file.raw) {
    files = file.raw
    file = file.raw
  } else {
    file = files
    btnStatus = false
  }
  if (!file) return

  let { size: fileSize, name: fileName, type: fileType } = file,
      curSize = Number(localStorage.getItem(fileName) || 0),
      chunkSize = 64 * 1024,
      i = 0
  hashFileName = CryptoJS.MD5(fileName)

  while (curSize < fileSize && !btnStatus) {
    const chunk = file.slice(curSize, curSize + chunkSize)
    const chunkName = CryptoJS.MD5(chunk) + '_' + i

    const data = createFormData({
      chunk,
      chunkName,
      fileName,
      fileType
    })

    try {
      await http.post('/upload', data)
    } catch (e) {
      console.log(e)
    }

    curSize += chunkSize
    // 设置进度条
    setProcess(fileSize, chunkSize)
    // 设置断点位置
    localStorage.setItem(fileName, String(curSize))
    // 设置文件索引
    i++
  }

  if (!btnStatus)
    mergeVideo(fileName, fileType)
}

const mergeVideo = async (fileName, fileType) => {
  videoProcess = true
  // 关闭按钮操作
  btnShow = false
  localStorage.removeItem(fileName)
  const res = await http.get('/merge', {
    params: {
      hashFolderName: hashFileName
    }
  })
  videoProcess = false
  const { videoSrc } = res.data
  new HlsPlayer({
    id: 'video-player',
    url: videoSrc
  })

}

const createFormData = ({chunk, chunkName, fileName, fileType}) => {
  const formData = new FormData()
  formData.append('chunk', chunk)
  formData.append('chunkName', chunkName)
  formData.append('fileName', fileName)
  formData.append('fileType', fileType)

  return formData
}

const setProcess = (fileSize, chunkSize) => {
  processSize += Number(100 / (fileSize / chunkSize))

  if (processSize > 100) {
    processSize = 100
  }
}

const switchUploader = () => {
  btnStatus = !btnStatus
  btnStatus ? btnText = '上传中' : btnText = '暂停'
}
</script>

<style scoped>
.btn,
.status {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.el-progress {
  width: 50%;
}

#video-player {
  margin: 20px auto;
}
</style>