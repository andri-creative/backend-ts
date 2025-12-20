export default (url: string) =>
  url
    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
    .replace("?dl=0", "");
