## video-uploader-demo
这是一个视频上传 DEMO, 前端部分基于 Vue3 + Element-Plus, 后端部分基于 Express

### Screenshot
![slideloop](https://kanmalu.com/images/video-uplodaer.gif)

### 思路
1. 拿到 File 对象，利用File.slice 方法对文件进行切片处理，再上传给后端
2. 后端拿到 File 对象后，将其写入 temp 目录中，
3. 当前端发完了所有的切片请求后，就需要告诉后端可以合并 temp 目录中的切片了，所以此时需要发一个"merge"的网络请求
4. 后端接收到 merge 请求后,开始将 temp 目录下的切片逐一写入到 video 文件夹中，拼成一个完整的视频文件
5. 之后进行视频转码，如将 mp4 文件转换成 m3u8 文件, 发给前端视频文件地址，前端拿到地址后就可以进行视频播放了