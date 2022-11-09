let instance = axios.create()

instance.defaults.baseURL = 'http://127.0.0.1:8888'
instance.defaults.headers['Content-Type'] = 'multipart/form-data';
instance.defaults.transfromRequest = (data, headers) => {
  const contentType = headers['Content-Type']
  if (contentType === 'application/x-www-from-urlencoded') {
    return Qs.stringfy(data) //{file:'xxx',fileName:'xxx'}=> file="xxx"&fileName="xxx"
  }
  return data
}

instance.interceptors.response.use(response => {
  return response.data
}, reason => {
  return Promise.reject(reason)
})