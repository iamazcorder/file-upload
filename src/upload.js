//基于FromData实现文件上传
(function () {
  let upload = document.querySelector('#upload1');
  let upload_input = upload.querySelector('.upload_ipt');
  let upload_button_select = upload.querySelector('.upload_button.select');
  let upload_button_upload = upload.querySelector('.upload_button.upload');
  let upload_tip = upload.querySelector('.upload_tip');
  let upload_list = upload.querySelector('.upload_list');

  let _file = null

  //上传文件之后控制按钮状态
  const handleDisable = flag => {
    if (flag) {
      upload_button_select.classList.add('disable')
      upload_button_upload.classList.add('loading')
    }
    upload_button_select.classList.remove('disable')
    upload_button_upload.classList.remove('loading')

  }

  //上传文件到服务器
  upload_button_upload.addEventListener('click', function () {
    if (this.classList.contains('disable') || this.classList.contains('loading')) {
      return
    }

    if (!_file) {
      alert('请先选择要上传的文件')
      return
    }

    handleDisable(true)

    //把文件传给服务器：FormData/base64
    //FromData
    let formData = new FormData()
    formData.append('file', _file)
    formData.append('filename', _file.name)
    instance.post('/upload_single', formData).then(data => {
      if (+data.code === 0) {
        alert(`文件上传成功，可以基于${data.servicePath}访问这个文件`)
        return
      }

      return Promise.reject(data.codeText)
    }).catch(reason => {
      alert('文件上传失败，稍后再试')
    }).finally(() => {
      handleDisable(false)
    })
  })

  //通过事件委托解决移除元素点击事件
  upload_list.addEventListener('click', function (e) {
    let target = e.target
    if (target.tagName === 'EM') {
      //点击的是移除按钮
      _file = null
      upload_tip.style.display = 'block'
      upload_list.style.display = 'none'
      upload_list.innerHTML = ``
    }
  })

  //监听用户选择文件的操作
  upload_input.addEventListener('change', function () {
    //获取用户选中文件对象
    //name:文件名
    //size:文件大小
    //type:文件类型
    let file = this.files[0]
    if (!file) return

    //限制文件上传格式
    //方案一
    if (!/(PNG|JPG|JPEG)/i.test(file.type)) {
      alert('上传的文件只能是PNG/JPG/JPEG 格式的')
      return
    }
    //方案二
    //使用表单input的accept属性限制上传文件格式
    //accept=".png,.jpg,.jpeg"


    //限制文件上传大小
    if (file.size > 2 * 1024 * 1024) {
      alert('上传的文件不能超过2MB')
      return
    }

    _file = file

    //显示上传文件
    upload_tip.style.display = 'none'
    upload_list.style.display = 'block'
    upload_list.innerHTML = ` <li>
    <span>文件：${file.name}</span>
    <span><em>移除</em></span>
  </li>`
  })

  //监听上传文件按钮
  upload_button_select.addEventListener('click', function () {
    if (this.classList.contains('disable') || this.classList.contains('loading')) {
      return
    }
    upload_input.click() //手动点击隐藏的选择框
  })
})()


  //基于base64实现文件上传
  (function () {
    let upload = document.querySelector('#upload2');
    let upload_input = upload.querySelector('.upload_ipt');
    let upload_button_select = upload.querySelector('.upload_button.select');

    //验证按钮是否处于可操作状态
    const checkIsDisabled = element => {
      let classList = element.classList
      return classList.contains('disable') || classList.contains('loading')
    }


    //把选择的文件读取成base64
    const changeBASE64 = (file) => {
      return new Promise((resolve, reject) => {
        let fileReader = new FileReader()
        fileReader.readAsDataURL(file)
        fileReader.onload = e => {
          resolve(e.target.result)
        }
      })
    }

    //监听用户选择文件的操作
    upload_input.addEventListener('change', async function () {
      //获取用户选中文件对象
      //name:文件名
      //size:文件大小
      //type:文件类型
      let file = this.files[0]
      let BASE64
      let data
      if (!file) return

      //限制文件上传大小
      if (file.size > 2 * 1024 * 1024) {
        alert('上传的文件不能超过2MB')
        return
      }

      upload_button_select.classList.add('loading')

      BASE64 = await changeBASE64(file)

      try {
        data = await instance.post('/upload_single_base64', {
          file: BASE64,
          filename: file.name
        }, {
          headers: {
            'Content-Type': 'application-x-www-form-urlencoded'
          }
        })

        if (+data.code === 0) {
          alert('文件上传成功')
        }

        throw data.codeText
      } catch (err) {
        alert('图片上传失败')
      }


      upload_button_select.classList.remove('loading')

    })

    //监听上传文件按钮
    upload_button_select.addEventListener('click', function () {
      if (checkIsDisabled(this)) return;
      upload_input.click() //手动点击隐藏的选择框
    })
  })()

  //文件缩略图以及自动生成名字    hash名字的处理 文件重复上传处理
  (function () {
    let upload = document.querySelector('#upload3');
    let upload_input = upload.querySelector('.upload_ipt');
    let upload_button_select = upload.querySelector('.upload_button.select');
    let upload_button_upload = upload.querySelector('.upload_button.upload');
    let upload_abbre = upload.querySelector('.upload_abbre');
    let upload_abbre_img = upload_abbre.querySelector('img');

    let _file = null



    //验证按钮是否处于可操作状态
    const checkIsDisabled = element => {
      let classList = element.classList
      return classList.contains('disable') || classList.contains('loading')
    }


    //把选择的文件读取成base64
    const changeBASE64 = (file) => {
      return new Promise((resolve, reject) => {
        let fileReader = new FileReader()
        fileReader.readAsDataURL(file)
        fileReader.onload = e => {
          resolve(e.target.result)
        }
      })
    }

    //把文件对象转化为buffer格式的数据
    const changeBuffer = (file) => {
      return new Promise(resolve => {
        let fileReader = new FileReader()
        fileReader.readAsArrayBuffer(file)
        fileReader.onload = e => {
          let buffer = e.target.result
          let spark = new SparkMD5.ArrayBuffer()
          let HASH
          let suffix //文件后缀

          spark.append(buffer)
          HASH = spark.end()
          suffix = /\.([a-zA-Z0-9]+)$/.exec(_file.name)[1]
          resolve({
            buffer,
            HASH,
            suffix,
            filename: `${HASH}.${suffix}`
          })
        }
      })
    }

    //上传文件之后控制按钮状态
    const handleDisable = flag => {
      if (flag) {
        upload_button_select.classList.add('disable')
        upload_button_upload.classList.add('loading')
      }
      upload_button_select.classList.remove('disable')
      upload_button_upload.classList.remove('loading')

    }

    //上传文件到服务器
    upload_button_upload.addEventListener('click', async function () {
      if (checkIsDisabled(this)) return;

      if (!_file) {
        alert('请先选择要上传的文件')
        return
      }

      handleDisable(true)

      //生成文件的hash名
      let { filename } = await changeBuffer(_file)

      //把文件传给服务器：FormData/base64
      //FromData
      let formData = new FormData()
      formData.append('file', _file)
      formData.append('filename', filename)
      instance.post('/upload_single_name', formData).then(data => {
        if (+data.code === 0) {
          alert(`文件上传成功，可以基于${data.servicePath}访问这个文件`)
          return
        }

        return Promise.reject(data.codeText)
      }).catch(reason => {
        alert('文件上传失败，稍后再试')
      }).finally(() => {
        handleDisable(false)
        upload_abbre.style.display = 'none'
        upload_abbre_img.src = ''
        _file = null
      })
    })


    //文件预览 就是将文件对象转化成base64的格式 ，赋值给img标签的src属性
    upload_input.addEventListener('change', async function () {
      //获取用户选中文件对象
      //name:文件名
      //size:文件大小
      //type:文件类型
      let file = this.files[0]
      let BASE64
      let data

      if (!file) return

      //限制文件上传大小
      if (file.size > 2 * 1024 * 1024) {
        alert('上传的文件不能超过2MB')
        return
      }

      _file = file

      upload_button_select.classList.add('disable')
      //文件预览，就是将文件对象转化成base64的格式 ，赋值给img标签的src属性
      BASE64 = await changeBASE64(file)

      upload_abbre.style.display = 'block'
      upload_abbre_img.src = BASE64

      upload_button_select.classList.remove('disable')

    })

    //监听上传文件按钮
    upload_button_select.addEventListener('click', function () {
      if (checkIsDisabled(this)) return;
      upload_input.click() //手动点击隐藏的选择框
    })
  })()


  //进度管控
  (function () {
    let upload = document.querySelector('#upload4');
    let upload_input = upload.querySelector('.upload_ipt');
    let upload_button_select = upload.querySelector('.upload_button.select');
    let upload_progress = upload.querySelector('.upload_progress');
    let upload_progress_value = upload_progress.querySelector('.value');


    //验证按钮是否处于可操作状态
    const checkIsDisabled = element => {
      let classList = element.classList
      return classList.contains('disable') || classList.contains('loading')
    }

    upload_input.addEventListener('change', async function () {
      //获取用户选中文件对象
      //name:文件名
      //size:文件大小
      //type:文件类型
      let file = this.files[0]
      let data

      if (!file) return

      //限制文件上传大小
      if (file.size > 2 * 1024 * 1024) {
        alert('上传的文件不能超过2MB')
        return
      }

      upload_button_select.classList.add('disable')

      try {
        let formData = new FormData()
        formData.append('file', file)
        formData.append('filename', file.name)
        data = await instance.post('/uplod/single', formData, {
          //文件上传中的回调函数，内部就是去监听xhr.upload.progress
          onUploadProgress(e) {
            let {
              loaded, //已经传了多少
              total //总共多少
            } = e

            upload_progress.style.display = 'block'
            upload_progress_value.style.width = `${loaded / total * 100}%`
          }
        })

        if (+data.code === 0) {
          upload_progress_value.style.width = `100%`
          alert('文件上传成功')
          return
        }
        throw data.codeText
      } catch (err) {
        alert('文件上传失败')
      } finally {
        upload_button_select.classList.remove('disable')
        upload_progress.style.display = 'none'
        upload_progress_value.style.width = `0%`
      }

    })

    //监听上传文件按钮
    upload_button_select.addEventListener('click', function () {
      if (checkIsDisabled(this)) return;
      upload_input.click() //手动点击隐藏的选择框
    })
  })()


  //多文件上传和进度管控
  //input元素添加一个  multiple属性实现多文件选择
  (function () {
    let upload = document.querySelector('#upload5');
    let upload_input = upload.querySelector('.upload_ipt');
    let upload_button_select = upload.querySelector('.upload_button.select');
    let upload_button_upload = upload.querySelector('.upload_button.upload');
    let upload_list = upload.querySelector('.upload_list');
    let _files = []



    //验证按钮是否处于可操作状态
    const checkIsDisabled = element => {
      let classList = element.classList
      return classList.contains('disable') || classList.contains('loading')
    }


    //上传文件之后控制按钮状态
    const handleDisable = flag => {
      if (flag) {
        upload_button_select.classList.add('disable')
        upload_button_upload.classList.add('loading')
      }
      upload_button_select.classList.remove('disable')
      upload_button_upload.classList.remove('loading')

    }

    //上传文件到服务器
    upload_button_upload.addEventListener('click', async function () {
      if (checkIsDisabled(this)) return;

      if (_files.length === 0) {
        alert('请先选择要上传的文件')
        return
      }

      handleDisable(true)

      //循环发送请求，同时监控每一个上传进度
      //获取所有的li
      let listArr = Array.from(upload_list.querySelectorAll('li'))
      _files = _files.map(item => {
        let fm = new FormData()
        let curLi = listArr.find(li => li.getAttribute('key') === item.key)
        let curSpan = curLi ? curLi.querySelector('span:nth-last-child(1)') : null
        fm.append('file', item.file)
        fm.append('filename', item.filename)
        return instance.post('/upload_single', fm, {
          onUploadProgress(e) {
            let {
              loaded,
              total
            } = e

            if (curSpan) {
              curSpan.innerHTML = `${(loaded / total * 100).toFixed(2)}%`
            }
          }
        }).then(data => {
          if (+data.code === 0) {
            if (curSpan) {
              curSpan.innerHTML = `100%`
            }
            return
          }
          return Promise.reject()
        })
      })


      //所有处理完成
      Promise.all(_files).then(() => {
        alert('所有文件都上传成功')
      }).catch(() => {
        alert('上传过程中出现问题')
      }).finally(() => {
        handleDisable(false)
        _files = []
        upload_list.innerHTML = ''
        upload_list.style.display = 'none'
      })
    })

    //基于事件委托实现移除操作
    upload_list.addEventListener('click', e => {
      let target = e.target
      let curLi = null
      if (target.tagName === 'EM') {
        curLi = target.parentNode.parentNode

        if (curLi) {
          upload_list.removeChild(curLi)
          let key = curLi.getAttribute('key')
          _files = _files.filter(item => {
            item.key !== key
          })
          if (_files.length === 0) {
            upload_list.style.display = 'none'
          }
        }

      }
    })

    //获取唯一值 随机数+时间戳
    const createRandom = () => {
      let random = Math.random() * new Date()
      return random.toString(16).replace('.', '')
    }
    upload_input.addEventListener('change', async function () {
      //获取用户选中文件对象
      //name:文件名
      //size:文件大小
      //type:文件类型
      _files = Array.from(this.files) //类数组
      if (_files.length === 0) return

      //重构集合的数据结构，集合中的每一个对象除了有文件对象之外，还有该文件的唯一值（li的唯一属性），后面点击删除按钮的时候
      //根据点击的元素的唯一属性，删除集合中的这一项
      _files = _files.map(file => {
        return {
          file,
          filename: file.name,
          key: createRandom()
        }
      })

      let str = ``
      _files.forEach((item, index) => {
        str += `<li key="${item.key}">
        <span>文件${index + 1}：${item.filename} </span>
        <span><em>移除</em></span>
      </li>`
      })

      upload_list.innerHTML = str
    })

    //监听上传文件按钮
    upload_button_select.addEventListener('click', function () {
      if (checkIsDisabled(this)) return;
      upload_input.click() //手动点击隐藏的选择框
    })
  })()


  //拖拽上传 也可选择点击上传
  (function () {
    let upload = document.querySelector('#upload6');
    let upload_input = upload.querySelector('.upload_ipt');
    let upload_submit = upload.querySelector('.upload_submit');
    let upload_mark = upload.querySelector('.upload_mark'); //遮罩层 图片上传过程中显示

    let isRun = false
    //上传文件
    const uploadFile = async file => {
      if (isRun) return;
      isRun = true
      upload_mark.style.display = 'block'
      try {
        let fm = new FormData()
        let data
        fm.append('file', file)
        fm.append('filename', file.name)
        data = await instance.post('/upload_single', fm)

        if (+data.code === 0) {
          alert('文件上传成功')
          return
        }

        throw data.codeText

      } catch (err) {
        alert('上传失败')
      } finally {
        upload_mark.style.display = 'none'
        isRun = false
      }
    }

    //拖拽获取 dragenter进入 dragleave离开 dragover元素内移动 drop放开
    //把文件拖到浏览器中，浏览器默认会打开新的页面
    // upload.addEventListener('dragenter', function () {

    // })

    // upload.addEventListener('dragleave', function () {

    // })

    upload.addEventListener('dragover', function (e) {
      e.preventDefault()
    })
    upload.addEventListener('drop', function (e) {
      e.preventDefault() //阻止浏览器打开新页面
      let file = e.dataTransfer.files[0]
      if (!file) return;
      uploadFile(file)
    })

    //手动选择获取文件
    upload_input.addEventListener('change', function () {
      let file = this.files[0]
      if (!file) return
      uploadFile(file)
    })

    upload_submit.addEventListener('click', function () {
      upload_input.click()
    })
  })()


  //大文件的切片上传和断点续传
  (function () {
    let upload = document.querySelector('#upload4');
    let upload_input = upload.querySelector('.upload_ipt');
    let upload_button_select = upload.querySelector('.upload_button.select');
    let upload_progress = upload.querySelector('.upload_progress');
    let upload_progress_value = upload_progress.querySelector('.value');


    //验证按钮是否处于可操作状态
    const checkIsDisabled = element => {
      let classList = element.classList
      return classList.contains('disable') || classList.contains('loading')
    }

    //把文件对象转化为buffer格式的数据
    const changeBuffer = (file) => {
      return new Promise(resolve => {
        let fileReader = new FileReader()
        fileReader.readAsArrayBuffer(file)
        fileReader.onload = e => {
          let buffer = e.target.result
          let spark = new SparkMD5.ArrayBuffer()
          let HASH
          let suffix //文件后缀

          spark.append(buffer)
          HASH = spark.end()
          suffix = /\.([a-zA-Z0-9]+)$/.exec(_file.name)[1]
          resolve({
            buffer,
            HASH,
            suffix,
            filename: `${HASH}.${suffix}`
          })
        }
      })
    }

    upload_input.addEventListener('change', async function () {
      //获取用户选中文件对象
      //name:文件名
      //size:文件大小
      //type:文件类型
      let file = this.files[0]
      if (!file) return

      upload_button_select.classList.add('disable')
      upload_progress.style.display = 'block'

      //从服务器获取已经上传的切片，通过HASH查找
      //1.获取文件的HASH
      let {
        HASH,
        suffix
      } = await changeBuffer(file)

      //2.获取已经上传的切片
      let already = []
      let data = null
      try {
        data = await instance.get('/upload_already', {
          params: {
            HASH
          }
        })
        if (+data.code === 0) {
          already = data.fileList
        }
      } catch (err) { }

      //3.实现文件切片处理
      //方案：先用固定大小计算出切片的数量，如果切片数量超出限制的最大切片数量，则以固定数量计算出每个切片的大小
      let maxSize = 1024 * 100 //100KB
      let count = Math.ceil(file.size / maxSize)
      let index = 0
      let chunks = []  //存储切片
      if (count > 100) {
        maxSize = file.size / 100
        count = 100
      }

      //file.slice(开始切割的字节，切割到哪个字节) 从哪个字节切割到哪个字节
      while (index < count) {
        chunks.push({
          file: file.slice(index * maxSize, (index + 1) * maxSize),
          filename: `${HASH}_${index + 1}.${suffix}`
        })
        index++
      }

      //上传成功的处理
      index = 0
      //每个切片上传成功之后都会调用这个方法
      const complete = async () => {
        //管控京都条
        index++
        upload_progress_value.style.width = `${index / count * 100}%`


        //所有切片上传成功，通知服务器合并切片
        if (index >= count) {
          upload_progress_value.style.width = `100%`
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
              alert('文件上传成功')
              clear()
              return
            }
            throw data.codeText
          } catch (err) {
            alert('合并切片失败')
            clear()
          }
        }

      }

      //文件最终无论传输成功还是失败都会调用这个方法
      const clear = () => {
        upload_button_select.classList.remove('disable')
        upload_progress.style.display = 'none'
        upload_progress_value.style.width = `0%`
      }

      //把每个切片传给服务器
      chunks.forEach(chunk => {
        //已经上传的不需要再上传
        if (already.length > 0 && already.includes(chunk.filename)) {
          complete()
          return
        }

        let fm = new FormData()
        fm.append('file', chunk.file)
        fm.append('filename', chunk.filename)
        instance.post('/upload_chunk', fm).then(data => {
          if (+data.code === 0) {
            complete()
            return
          }
          return Promise.reject(data.codeText)
        }).catch(err => {
          alert('文件上传失败')
          clear()
        })
      })

    })

    //监听上传文件按钮
    upload_button_select.addEventListener('click', function () {
      if (checkIsDisabled(this)) return;
      upload_input.click() //手动点击隐藏的选择框
    })
  })()
