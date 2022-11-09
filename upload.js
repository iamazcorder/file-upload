const upload_inp = document.querySelector('upload-inp')  //表单
const upload_button_select = document.querySelector('upload-button-select')  //按钮
const upload_progress = document.querySelector('upload-progress') //进度条


//通过文件生成对应的hash和后缀名
function changeBuffer(file) {

}

upload_inp.addEventListener('change', async function () {
  let file = upload_inp.files[0]
  if (!file) return

  //将上传按钮的样式设置为正在上传
  upload_button_select.classList.add('loading')

  //获取文件的HASH 
  const { HASH, suffix } = await changeBuffer(file)

  //已经上传的切片列表
  const already = []

  //存储切片的列表
  const chunks = []

  //记录当前传到第几个切片
  let index = 0

  //获取已经上传的切片信息
  //服务器会根据hash值找到临时文件夹，获取文件夹中的切片，返回
  try {
    data = await instance.get('/upload_already', {
      params: {
        HASH
      }
    })
    //请求成功
    if (+data.code === 0) {
      already = data.fileList
    }
  } catch (err) { }



  //实现文件切片处理
  //1.定义切片的大小和数量  固定大小+固定数量
  //方案：先使用固定大小来计算切片数量   如果计算得出切片数量超出我们设置的最大切片数量
  //那么还是使用我们设置的最大切片数量，然后根据最大切片数量计算每个切片的大小
  let maxSize = 1024 * 100
  let count = Math.ceil(file.size / maxSize)
  if (count > 100) {
    count = 100
    maxSize = file.size / count
  }

  //2.把文件变成切片 存储起来
  while (index < count) {
    chunks.push({
      //存储开始位置：index*maxSize
      //存储结束位置：(index+1)*maxSize
      file: file.slice(index * maxSize, (index + 1) * maxSize),
      fileName: `${HASH}_${index + 1}.${suffix}`
    })
    index++
  }

  index = 0
  //完全成功或者失败的处理
  function clear() {
    upload_button_select.classList.remove('loading')
    upload_progress.style.display = 'none'
    upload_progress._value.style.width = '0%'
  }

  //切片上传成功的处理
  const complete = async function () {
    //管控进度条
    index++
    upload_progress._value.style.width = `${index / count * 100}%`

    //当所有切片上传成功，通知服务器合并切片
    if (index < count) return
    upload_progress._value.style.width = '100%'
    try {
      data = await instance.post('/upload_merge', {
        HASH,
        count
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      if (+data.code === 0) {
        alert(`文件上传成功，你可以基于${data.servicePath}访问该文件`)
        clear()
        return
      }
      throw data.codeText
    } catch (err) {
      alert('切片合并失败，稍后再试')
      clear()
    }
  }

  //3.把存储的每个切片上传到服务器
  chunks.forEach(chunk => {
    //先判断是否已经上传过，是的话不需要再传
    if (already.length > 0 && already.includes(chunk.fileName)) {
      complete()
      return
    }
    //服务器要求上传的文件类型 表单类型
    let fm = new FormData()
    fm.append('file', chunk.file)
    fm.append('filename', chunk.fileName)
    instance.post('/upload_chunk', fm).then(data => {
      //切片发送成功
      if (+data.code === 0) {
        complete()
        return
      }
      //失败
      return Promise.reject(data.codeText)
    }).catch(err => {
      //切片发送失败
      alert('文件上传失败，请稍后再试')
      clear()
    })
  })
})