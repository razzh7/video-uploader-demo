const ffmpeg = require('fluent-ffmpeg')
const formatVideo = (path, {
    videoCodec,
    format,
    outputOptions,
    outputOption,
    output,
    onError,
    onEnd
}) => {
    ffmpeg(path)
        .videoCodec(videoCodec)
        .format(format)
        .outputOptions(outputOptions)
        .outputOption(outputOption)
        .output(output)
        .on('error', onError)
        .on('end', onEnd)
        .run()
}

module.exports = formatVideo