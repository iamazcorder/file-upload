# 单一文件上传[FROM-DATA]
##    const fm = new FormData()  
##    fm.append('file',file)
##    fm.append('filename',file.name)


# 单一文件上传[BASE64]，只适合图片
##    fileReader = new FileReader()
##    fileReader.readAsDataURL(file)
##    fileReader.onload = e => {
          resolve(e.target.result)
        }
##    headers: {
            'Content-Type': 'application-x-www-form-urlencoded'
          }


# 单一文件上传[缩略图处理]
##    将文件的base64赋值给img标签的src属性

# 单一文件上传[生成唯一的文件名]
##    文件=> buffer => SparkMD5.ArrayBuffer() => HASH = spark.end()


# 单一文件上传[进度管控]


# [多文件上传]


# [拖拽上传]


# 大文件[切片上传]和[断点续传]
(1).将一个大文件分成多个切片(HASH_1.png)，发送给服务器 
   ###先用固定大小计算出切片的数量，如果切片数量超出限制的最大切片数量，则以固定数量计算出每个切片的大小

(2).服务器会创建一个存放切片的临时目录(HASH)，把切片存放到临时目录中
(3).当所有切片发送成功之后，客户端会通知服务器合并切片，服务器从临时目录中取出所有切片，按序合并
(4).合并完成之后，删除临时目录和切片，只保留合并后的文件

(5).如果发送一半出现某些错误，导致客户端需要重新上传

(6).前端会在每次用户上传文件的时候，就先去询问服务器，当前传送的文件已经发送的切片，得到一个已经被发送的切片的名字列表

(7).然后我们会在每次发送一个切片之前，查看列表中是否有当前这个要发送的切片，如果有，就不发，没有则继续发